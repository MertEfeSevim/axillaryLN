"use client";

import { startTransition, useState } from "react";
import { defaultSelections, evaluateAxillaryModel, fuzzyModel } from "@/lib/fuzzy";

const inputGroups = [
  {
    id: "nodal",
    eyebrow: "En Supheli Lenf Nodu",
    title: "Nodal Morfoloji",
    description:
      "Meme MRG'de en supheli aksiller lenf nodunun kortikal ve morfolojik ozelliklerini secin.",
    inputs: fuzzyModel.nodalSystem.inputs,
  },
  {
    id: "primary",
    eyebrow: "Primer Kitle",
    title: "Tumor Ozellikleri",
    description:
      "Primer kitlenin boyutu ve cevresel davranisini kategorik olarak isaretleyin.",
    inputs: fuzzyModel.primarySystem.inputs,
  },
];

const outputConfig = {
  low: { tone: "cool", label: "Dusuk" },
  intermediate: { tone: "warm", label: "Orta" },
  high: { tone: "hot", label: "Yuksek" },
  no: { tone: "cool", label: "Tutulum Yok" },
  yes: { tone: "hot", label: "Tutulum Var" },
};

function selectResultCopy(result) {
  if (result.category === "yes") {
    return {
      headline: "Aksiller tutulum lehine",
      detail: "Son cikis pozitif bandda. Cerrahi ve patolojik korelasyon gerektiren yuksek dikkatli yorum uygun olur.",
    };
  }

  return {
    headline: "Aksiller tutulum aleyhine",
    detail: "Son cikis negatif bandda. Klinik karar icin primer lezyon ve nodal baglam birlikte degerlendirilmeli.",
  };
}

function Gauge({ value }) {
  const safeValue = Math.max(0, Math.min(100, value));
  const accentStop = Math.round(safeValue * 3.6);

  return (
    <div
      className="gauge"
      style={{
        background: `conic-gradient(from 220deg, var(--accent-strong) 0deg, var(--accent) ${accentStop}deg, rgba(24, 49, 87, 0.08) ${accentStop}deg, rgba(24, 49, 87, 0.08) 360deg)`,
      }}
    >
      <div className="gaugeInner">
        <span className="gaugeValue">{safeValue}</span>
        <span className="gaugeLabel">skor</span>
      </div>
    </div>
  );
}

function SegmentedScale({ result, labels }) {
  return (
    <div className="segmentedScale">
      {labels.map((item) => {
        const isActive = item.key === result.category;
        const tone = outputConfig[item.key]?.tone || "cool";

        return (
          <div
            className={`segment ${isActive ? `segmentActive ${tone}` : ""}`}
            key={item.key}
          >
            <span>{item.label}</span>
          </div>
        );
      })}
    </div>
  );
}

function OutputCard({ title, result, helper, labels }) {
  const tone = outputConfig[result.category]?.tone || "cool";

  return (
    <article className="outputCard">
      <div className="outputCardHeader">
        <p>{title}</p>
        <span className={`pill pill-${tone}`}>{outputConfig[result.category]?.label || result.categoryLabel}</span>
      </div>
      <div className="outputMeta">
        <strong>{result.percent}</strong>
        <span>/ 100</span>
      </div>
      <SegmentedScale result={result} labels={labels} />
      <p className="outputHelper">{helper}</p>
    </article>
  );
}

export default function HomePage() {
  const [selections, setSelections] = useState(defaultSelections);
  const results = evaluateAxillaryModel(selections);
  const finalCopy = selectResultCopy(results.finalResult);

  function updateSelection(inputId, optionKey) {
    startTransition(() => {
      setSelections((current) => ({
        ...current,
        [inputId]: optionKey,
      }));
    });
  }

  function resetSelections() {
    startTransition(() => {
      setSelections(defaultSelections);
    });
  }

  return (
    <main className="pageShell">
      <section className="hero">
        <div>
          <p className="heroKicker">Klinik karar destek arayuzu</p>
          <h1>Aksiller Lenf Nodu Tutulumu Icin Bulanik Mantik Paneli</h1>
          <p className="heroText">
            Meme MRG'de en supheli lenf nodu ile primer kitlenin goruntuleme
            ozelliklerini birlikte yorumlayan uc asamali Mamdani sistemi.
          </p>
        </div>
        <div className="heroMeta">
          <div className="metaBlock">
            <span>Alt sistem</span>
            <strong>3</strong>
          </div>
          <div className="metaBlock">
            <span>Kural sayisi</span>
            <strong>48</strong>
          </div>
          <div className="metaBlock">
            <span>Cikis</span>
            <strong>Kategorik</strong>
          </div>
        </div>
      </section>

      <section className="workspaceGrid">
        <div className="leftPanel">
          {inputGroups.map((group) => (
            <article className="panelCard inputPanel" key={group.id}>
              <div className="sectionHeader">
                <div>
                  <span className="sectionEyebrow">{group.eyebrow}</span>
                  <h2>{group.title}</h2>
                </div>
                <p>{group.description}</p>
              </div>

              <div className="inputStack">
                {group.inputs.map((input) => (
                  <div className="inputRow" key={input.id}>
                    <div className="inputRowHeader">
                      <h3>{input.name}</h3>
                      <span>{input.variable}</span>
                    </div>

                    <div className="choiceGrid">
                      {input.membershipFunctions.map((option) => {
                        const isActive = selections[input.id] === option.key;

                        return (
                          <button
                            type="button"
                            key={option.key}
                            className={`choiceButton ${isActive ? "choiceButtonActive" : ""}`}
                            onClick={() => updateSelection(input.id, option.key)}
                          >
                            <span>{option.label}</span>
                            {option.helper ? <small>{option.helper}</small> : null}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </article>
          ))}

          <article className="panelCard systemCard">
            <div className="sectionHeader">
              <div>
                <span className="sectionEyebrow">Sistem Akisi</span>
                <h2>FIS Mimarisi</h2>
              </div>
              <p>
                Nodal suphe ve primer tumor riski ayri hesaplanir, son cikis
                aksiller tutulum kararina tasinir.
              </p>
            </div>

            <div className="systemFigure">
              <img src="/system-tree.png" alt="Axillary fuzzy system tree" />
            </div>
          </article>
        </div>

        <aside className="rightPanel">
          <article className="panelCard resultPanel">
            <div className="sectionHeader compact">
              <div>
                <span className="sectionEyebrow">Analiz Sonuclari</span>
                <h2>Toplam Cikis</h2>
              </div>
              <button type="button" className="ghostButton" onClick={resetSelections}>
                Varsayilana Don
              </button>
            </div>

            <div className="primaryResult">
              <Gauge value={results.finalResult.percent} />
              <div className="primaryResultText">
                <p className="resultTag">{finalCopy.headline}</p>
                <h3>{results.finalResult.categoryLabel}</h3>
                <p>{finalCopy.detail}</p>
              </div>
            </div>

            <SegmentedScale
              result={results.finalResult}
              labels={[
                { key: "no", label: "Tutulum Yok" },
                { key: "yes", label: "Tutulum Var" },
              ]}
            />

            <div className="outputGrid">
              <OutputCard
                title="Nodal Suphe"
                result={results.nodalResult}
                helper="Kortikal kalinlik, hilus durumu ve sekil birlikte yorumlandi."
                labels={[
                  { key: "low", label: "Dusuk" },
                  { key: "intermediate", label: "Orta" },
                  { key: "high", label: "Yuksek" },
                ]}
              />
              <OutputCard
                title="Primer Tumor Riski"
                result={results.primaryResult}
                helper="Boyut, kenar ve peritumoral odem etkisi birlestirildi."
                labels={[
                  { key: "low", label: "Dusuk" },
                  { key: "intermediate", label: "Orta" },
                  { key: "high", label: "Yuksek" },
                ]}
              />
            </div>

            <article className="narrativeCard">
              <span className="narrativeLabel">Model yorumu</span>
              <p>{results.narrative}</p>
            </article>
          </article>
        </aside>
      </section>
    </main>
  );
}
