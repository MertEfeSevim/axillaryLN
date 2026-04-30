"use client";

import { startTransition, useDeferredValue, useEffect, useState } from "react";
import {
  createDefaultSelections,
  evaluateAxillaryModel,
  fuzzyUiConfig,
  loadFuzzyModel,
  sanitizeNumericSelection,
} from "@/lib/fuzzy";

const outputConfig = fuzzyUiConfig.resultTones;

function formatRange(range, unit) {
  return `${range[0]}-${range[1]}${unit ? ` ${unit}` : ""}`;
}

function formatMembershipShape(membershipFunction) {
  return `${membershipFunction.type} [${membershipFunction.params.join(", ")}]`;
}

function FileChip({ file }) {
  return (
    <a className="sourceLink" href={file.url} target="_blank" rel="noreferrer">
      <span>{file.fileName}</span>
      <small>{file.type}</small>
    </a>
  );
}

function NumericField({ input, value, onChange, onBlur }) {
  return (
    <div className="numericInputWrap">
      <input
        className="numericInput"
        type="number"
        inputMode="decimal"
        min={input.range[0]}
        max={input.range[1]}
        step={input.step || "any"}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onBlur={onBlur}
      />
      <span className="modeBadge">numeric</span>
    </div>
  );
}

function CategoricalField({ input, value, onChange }) {
  return (
    <div
      className="choiceGrid"
      style={{
        gridTemplateColumns: `repeat(${input.membershipFunctions.length}, minmax(0, 1fr))`,
      }}
    >
      {input.membershipFunctions.map((membershipFunction) => {
        const isActive = value === membershipFunction.key;

        return (
          <button
            type="button"
            key={membershipFunction.key}
            className={`choiceButton ${isActive ? "choiceButtonActive" : ""}`}
            aria-pressed={isActive}
            onClick={() => onChange(membershipFunction.key)}
          >
            <span className="choiceTitle">{membershipFunction.label}</span>
            <span className="choiceMeta">{formatMembershipShape(membershipFunction)}</span>
          </button>
        );
      })}
    </div>
  );
}

function InputField({ input, value, onCategoricalChange, onNumericChange, onNumericBlur }) {
  return (
    <div className="fieldRow">
      <div className="fieldHeader">
        <div>
          <h3>{input.name}</h3>
          <p className="fieldSubline">{formatRange(input.range, input.unit)}</p>
        </div>
        <span className="fieldType">{input.mode}</span>
      </div>

      {input.mode === "numeric" ? (
        <NumericField
          input={input}
          value={value}
          onChange={onNumericChange}
          onBlur={onNumericBlur}
        />
      ) : (
        <CategoricalField input={input} value={value} onChange={onCategoricalChange} />
      )}

      <div className="membershipStrip">
        {input.membershipFunctions.map((membershipFunction) => (
          <span className="membershipPill" key={membershipFunction.key}>
            {membershipFunction.label}: {formatMembershipShape(membershipFunction)}
          </span>
        ))}
      </div>
    </div>
  );
}

function MetricFrame({ result }) {
  const tone = outputConfig[result.category] || "cool";

  return (
    <div className={`metricFrame tone-${tone}`}>
      <span className="metricLabel">{result.outputName}</span>
      <strong className="metricValue">{result.displayValue}</strong>
      <span className="metricRange">
        range {result.range[0]}-{result.range[1]}
      </span>
    </div>
  );
}

function InsightCard({ title, result, helper }) {
  const tone = outputConfig[result.category] || "cool";

  return (
    <article className={`insightCard tone-${tone}`}>
      <p className="insightEyebrow">{title}</p>
      <div className="insightHeadline">
        <div>
          <h3>{result.categoryLabel}</h3>
          <p className="insightOutputName">{result.outputName}</p>
        </div>
        <div className="insightScore">
          <strong>{result.displayValue}</strong>
          <span>0-1 crisp</span>
        </div>
      </div>
      <p className="insightBody">{helper}</p>
    </article>
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

  function updateCategoricalSelection(inputId, optionKey) {
    startTransition(() => {
      setSelections((current) => {
        if (!current || current[inputId] === optionKey) {
          return current;
        }

        return {
          ...current,
          [inputId]: optionKey,
        };
      });
    });
  }

  function updateNumericSelection(inputId, rawValue) {
    startTransition(() => {
      setSelections((current) => {
        if (!current) {
          return current;
        }

        return {
          ...current,
          [inputId]: rawValue,
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
      <main className="dashboardPage">
        <section className="headlineBand singlePanel">
          <div className="headlineBandCopy">
            <span className="sectionEyebrow">Load error</span>
            <h2>FIS dosyalari okunamadi</h2>
            <p>{loadError}</p>
          </div>
        </section>
      </main>
    );
  }

  if (!model || !selections || !results) {
    return (
      <main className="dashboardPage">
        <section className="headlineBand singlePanel">
          <div className="headlineBandCopy">
            <span className="sectionEyebrow">Workspace load</span>
            <h2>axillaryLN modelleri yukleniyor</h2>
            <p>
              `axillaryLN_nodal.fis`, `axillaryLN_primary.fis`, `axillaryLN_final.fis`
              ve referans `.mat` dosyalari okunuyor.
            </p>
          </div>
        </section>
      </main>
    );
  }

  const inputGroups = [
    {
      id: "nodal",
      eyebrow: model.nodalSystem.fileName,
      title: model.nodalSystem.name,
      description:
        "Bu panel dogrudan axillaryLN_nodal.fis icindeki input adlari, range degerleri ve MF tanimlari ile calisir.",
      inputs: model.nodalSystem.inputs,
    },
    {
      id: "primary",
      eyebrow: model.primarySystem.fileName,
      title: model.primarySystem.name,
      description:
        "Bu panel dogrudan axillaryLN_primary.fis icindeki input adlari, range degerleri ve MF tanimlari ile calisir.",
      inputs: model.primarySystem.inputs,
    },
  ];

  return (
    <main className="dashboardPage">
      <section className="headlineBand">
        <div className="headlineBandCopy">
          <span className="sectionEyebrow">FIS workspace</span>
          <h2>axillaryLN fuzzy systems</h2>
          <p>
            Veri girisi ve cikisi, verilen `.fis` ve `.mat` dosyalarindaki tanimlara
            gore yeniden kuruldu. `cortical_thickness` ve `tumor_size_mm` numerik
            giris alir; diger alanlar ilgili membership label&apos;lari ile kategorik
            calisir. Tum cikislar 0-1 araligindaki ham crisp deger olarak gosterilir.
          </p>

          <div className="sourceList">
            {fuzzyUiConfig.referenceFiles.map((file) => (
              <FileChip key={file.fileName} file={file} />
            ))}
          </div>
        </div>

        <button type="button" className="resetButton headlineReset" onClick={resetSelections}>
          Varsayilanlari yukle
        </button>
      </section>

      <section className="dashboardGrid">
        <div className="inputColumn">
          {inputGroups.map((group) => (
            <article className="sectionCard" key={group.id}>
              <div className="sectionHeader compactHeader">
                <div>
                  <span className="sectionEyebrow">{group.eyebrow}</span>
                  <h2>{group.title}</h2>
                </div>
                <p>{group.description}</p>
              </div>

              <div className="fieldStack">
                {group.inputs.map((input) => (
                  <InputField
                    key={input.id}
                    input={input}
                    value={selections[input.id]}
                    onCategoricalChange={(optionKey) =>
                      updateCategoricalSelection(input.id, optionKey)
                    }
                    onNumericChange={(rawValue) => updateNumericSelection(input.id, rawValue)}
                    onNumericBlur={() => normalizeNumericSelection(input)}
                  />
                ))}
              </div>
            </article>
          ))}
        </div>

        <aside className="insightColumn">
          <article className="resultStage">
            <div className="resultStageHeader">
              <div>
                <span className="sectionEyebrow">{model.finalSystem.fileName}</span>
                <h2>{results.finalResult.outputName}</h2>
              </div>
              <span
                className={`decisionBadge tone-${outputConfig[results.finalResult.category] || "cool"}`}
              >
                {results.finalResult.categoryLabel}
              </span>
            </div>

            <div className="resultStageBody">
              <MetricFrame result={results.finalResult} />

              <div className="decisionStack">
                <h3>{results.finalResult.categoryLabel}</h3>
                <p>
                  Final cikis, `nodal_suspicion` ve `primary_tumor_risk` crisp
                  degerlerinin `axillaryLN_final.fis` icine verilmesiyle hesaplanir.
                </p>
                <p className="decisionNarrative">{results.narrative}</p>
              </div>
            </div>
          </article>

          <div className="insightGrid">
            <InsightCard
              title={model.nodalSystem.fileName}
              result={results.nodalResult}
              helper="Ara cikis dogrudan axillaryLN_nodal.fis defuzz sonucudur."
            />
            <InsightCard
              title={model.primarySystem.fileName}
              result={results.primaryResult}
              helper="Ara cikis dogrudan axillaryLN_primary.fis defuzz sonucudur."
            />
          </div>
        </aside>
      </section>
    </main>
  );
}
