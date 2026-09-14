"use client";

import { startTransition, useDeferredValue, useEffect, useState } from "react";
import {
  createDefaultSelections,
  evaluateAxillaryModel,
  fuzzyUiConfig,
  loadFuzzyModel,
  sanitizeNumericSelection,
} from "@/lib/fuzzy";

const GROUP_TITLES = {
  nodalSystem: "lenf nodu",
  primarySystem: "primer tumor",
};

function formatMembershipShape(membershipFunction) {
  return `${membershipFunction.type} [${membershipFunction.params.join(", ")}]`;
}

function Info({ label, align = "start", below = false, children }) {
  return (
    <button
      type="button"
      className={`info info--${align}${below ? " info--below" : ""}`}
      aria-label={label}
      onClick={(event) => event.preventDefault()}
    >
      i<span className="tip">{children}</span>
    </button>
  );
}

function MembershipTip({ input }) {
  return (
    <>
      <b>
        {input.name} &middot; {input.range[0]}-{input.range[1]}
        {input.unit ? ` ${input.unit}` : ""}
      </b>
      {input.membershipFunctions.map((membershipFunction) => (
        <span className="tipRow" key={membershipFunction.key}>
          {membershipFunction.label}
          <code>{formatMembershipShape(membershipFunction)}</code>
        </span>
      ))}
    </>
  );
}

function Field({ input, value, onSelect, onNumericBlur }) {
  return (
    <div className="field">
      <div className="fieldName">
        <span>{input.name}</span>
        <Info label={`${input.name} uyelik fonksiyonlari`}>
          <MembershipTip input={input} />
        </Info>
      </div>

      {input.mode === "numeric" ? (
        <div className="num">
          <input
            type="number"
            inputMode="decimal"
            min={input.range[0]}
            max={input.range[1]}
            step={input.step || "any"}
            value={value}
            onChange={(event) => onSelect(event.target.value)}
            onBlur={onNumericBlur}
          />
          <em>{input.unit}</em>
        </div>
      ) : (
        <div className="seg">
          {input.membershipFunctions.map((membershipFunction) => (
            <button
              type="button"
              key={membershipFunction.key}
              className="segBtn"
              aria-pressed={value === membershipFunction.key}
              onClick={() => onSelect(membershipFunction.key)}
            >
              {membershipFunction.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function SubScore({ result }) {
  return (
    <div className="sub">
      <span>{result.outputName}</span>
      <strong>{result.displayValue}</strong>
      <em className="level" data-level={result.category}>
        {result.categoryLabel}
      </em>
    </div>
  );
}

export default function HomePage() {
  const [model, setModel] = useState(null);
  const [selections, setSelections] = useState(null);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    let isMounted = true;

    loadFuzzyModel()
      .then((nextModel) => {
        if (!isMounted) {
          return;
        }

        setModel(nextModel);
        setSelections(createDefaultSelections(nextModel));
      })
      .catch((error) => {
        if (!isMounted) {
          return;
        }

        setLoadError(error.message || "Model files could not be loaded.");
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const deferredSelections = useDeferredValue(selections);
  const results =
    model && deferredSelections ? evaluateAxillaryModel(model, deferredSelections) : null;

  function selectValue(inputId, nextValue) {
    startTransition(() => {
      setSelections((current) => {
        if (!current || current[inputId] === nextValue) {
          return current;
        }

        return {
          ...current,
          [inputId]: nextValue,
        };
      });
    });
  }

  function normalizeNumericSelection(input) {
    startTransition(() => {
      setSelections((current) => {
        if (!current) {
          return current;
        }

        return {
          ...current,
          [input.id]: sanitizeNumericSelection(input, current[input.id]),
        };
      });
    });
  }

  function resetSelections() {
    if (!model) {
      return;
    }

    startTransition(() => {
      setSelections(createDefaultSelections(model));
    });
  }

  if (loadError) {
    return (
      <main className="page">
        <p className="notice">
          <b>FIS dosyalari okunamadi</b>
          {loadError}
        </p>
      </main>
    );
  }

  if (!model || !selections || !results) {
    return (
      <main className="page">
        <p className="notice">modeller yukleniyor</p>
      </main>
    );
  }

  const { finalResult, nodalResult, primaryResult, decision } = results;
  const threshold = decision.threshold;
  const toPercent = (value) =>
    ((value - finalResult.range[0]) / (finalResult.range[1] - finalResult.range[0])) * 100;

  return (
    <main className="page">
      <header className="topbar">
        <div className="brand">
          <h1>axillaryLN</h1>
          <p>aksiller lenf nodu tutulumu &middot; bulanik cikarim</p>
        </div>

        <div className="topbarActions">
          <Info label="Model hakkinda" align="end" below>
            <b>Uc asamali Mamdani modeli</b>
            <span>
              Lenf nodu ve primer tumor sistemleri bagimsiz birer skor uretir; bu iki
              skor final sisteme girdi olur.
            </span>
            <span>
              Durulastirma <code>centroid</code>, cikis <code>0-1</code> araliginda
              sureklidir ve <code>{threshold.toFixed(2)}</code> ve uzeri pozitif kabul
              edilir.
            </span>
          </Info>
          <button type="button" className="ghostBtn" onClick={resetSelections}>
            sifirla
          </button>
        </div>
      </header>

      <div className="layout">
        <div className="inputs">
          {["nodalSystem", "primarySystem"].map((systemId) => {
            const system = model[systemId];

            return (
              <section className="group" key={systemId}>
                <div className="groupHead">
                  <h2>{GROUP_TITLES[systemId]}</h2>
                  <Info label={`${system.fileName} detaylari`}>
                    <b>{system.fileName}</b>
                    <span className="tipRow">
                      kural sayisi<code>{system.rules.length}</code>
                    </span>
                    <span className="tipRow">
                      durulastirma<code>{system.defuzzMethod}</code>
                    </span>
                    <span className="tipRow">
                      cikis<code>{system.output.name}</code>
                    </span>
                  </Info>
                </div>

                {system.inputs.map((input) => (
                  <Field
                    key={input.id}
                    input={input}
                    value={selections[input.id]}
                    onSelect={(nextValue) => selectValue(input.id, nextValue)}
                    onNumericBlur={() => normalizeNumericSelection(input)}
                  />
                ))}
              </section>
            );
          })}
        </div>

        <section className="result">
          <div className="resultHead">
            <span className="resultName">
              {finalResult.outputName}
              <Info label="Sonuc nasil hesaplanir" align="end" below>
                <b>Nasil hesaplanir</b>
                <span>
                  <code>{nodalResult.outputName}</code> ve{" "}
                  <code>{primaryResult.outputName}</code> crisp degerleri{" "}
                  <code>{model.finalSystem.fileName}</code> icine verilir.
                </span>
                <span>
                  Seviye en yuksek uyelik derecesinden, karar ise sabit{" "}
                  <code>{threshold.toFixed(2)}</code> esiginden gelir; ikisi
                  0.60-0.65 bandinda ayrisabilir.
                </span>
              </Info>
            </span>
            <span className="verdict" data-positive={decision.isPositive}>
              {decision.isPositive ? "pozitif" : "negatif"}
            </span>
          </div>

          <div>
            <div className="score">
              <span className="scoreNum">{finalResult.displayValue}</span>
              <span className="level" data-level={finalResult.category}>
                {finalResult.categoryLabel}
              </span>
            </div>
          </div>

          <div className="gauge" data-positive={decision.isPositive}>
            <span className="gaugeFill" style={{ width: `${toPercent(finalResult.crisp)}%` }} />
            <span className="gaugeMark" style={{ left: `${toPercent(threshold)}%` }} />
          </div>

          <div className="subs">
            <SubScore result={nodalResult} />
            <SubScore result={primaryResult} />
          </div>
        </section>
      </div>

      <footer className="sources">
        <b>kaynak</b>
        {fuzzyUiConfig.referenceFiles.map((file) => (
          <a key={file.fileName} href={file.url} target="_blank" rel="noreferrer">
            {file.fileName}
          </a>
        ))}
      </footer>
    </main>
  );
}
