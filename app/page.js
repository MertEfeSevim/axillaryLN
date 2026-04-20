"use client";

import { startTransition, useDeferredValue, useState } from "react";
import { defaultSelections, evaluateAxillaryModel, fuzzyModel } from "@/lib/fuzzy";

const inputGroups = [
  {
    id: "nodal",
    eyebrow: "En supheli lenf nodu",
    title: "Nodal Morfoloji",
    description: "Kortikal kalinlik, yagli hilus durumu ve nodul seklini birlikte degerlendirin.",
    inputs: fuzzyModel.nodalSystem.inputs,
  },
  {
    id: "primary",
    eyebrow: "Primer lezyon",
    title: "Tumor Ozellikleri",
    description: "Boyut, kenar paterni ve peritumoral odem ile primer risk cikisini olusturun.",
    inputs: fuzzyModel.primarySystem.inputs,
  },
];

const outputConfig = {
  low: { tone: "cool", label: "Dusuk Risk" },
  intermediate: { tone: "warm", label: "Orta Risk" },
  high: { tone: "hot", label: "Yuksek Risk" },
  no: { tone: "cool", label: "Negatif" },
  yes: { tone: "hot", label: "Pozitif" },
};

function selectResultCopy(finalResult, nodalResult, primaryResult) {
  if (finalResult.category === "yes") {
    if (nodalResult.category === "high" && primaryResult.category === "high") {
      return {
        badge: "Pozitif",
        headline: "Yuksek tutulum olasiligi",
        detail:
          "Nodal ve primer alt sistemler ayni anda yuksek banda yaslandigi icin final Mamdani cikisi belirgin bicimde pozitif yone tasiniyor.",
      };
    }

    if (nodalResult.category === "high") {
      return {
        badge: "Pozitif",
        headline: "Nodal desen baskin",
        detail:
          "En supheli lenf nodundaki morfolojik patern, primer riskten daha baskin calisarak final cikisi pozitif tarafta tutuyor.",
      };
    }

    return {
      badge: "Pozitif",
      headline: "Primer risk sonucu yukseltiyor",
      detail:
        "Primer tumor davranisi yuksek banda ciktigi icin toplam aksiller tutulum riski pozitif yonde agirlik kazaniyor.",
    };
  }

  if (nodalResult.category === "high" || primaryResult.category === "high") {
    return {
      badge: "Negatif",
      headline: "Sinirda ancak halen negatif",
      detail:
        "Alt sistemlerden biri yuksek banda yaklassa da bilesik kural tabani final sonucu halen negatif tarafta tutuyor.",
    };
  }

  return {
    badge: "Negatif",
    headline: "Dusuk tutulum olasiligi",
    detail:
      "Nodal morfoloji ve primer lezyon paternleri birlikte okundugunda toplam risk deseni negatif bandi destekliyor.",
  };
}

function ScoreFrame({ value, categoryLabel }) {
  const safeValue = Math.max(0, Math.min(100, value));
  const stop = Math.max(20, Math.round(safeValue * 3.6));

  return (
    <div
      className="scoreFrame"
      style={{
        background: `conic-gradient(from -90deg, var(--primary) 0deg, var(--secondary) ${stop}deg, rgba(24, 49, 87, 0.08) ${stop}deg, rgba(24, 49, 87, 0.08) 360deg)`,
      }}
    >
      <div className="scoreFrameInner">
        <span className="scoreFrameLabel">{categoryLabel}</span>
        <div className="scoreValueWrap">
          <strong className="scoreValue">{safeValue}</strong>
          <span className="scoreUnit">/100</span>
        </div>
      </div>
    </div>
  );
}

function InsightCard({ title, result, helper }) {
  const tone = outputConfig[result.category]?.tone || "cool";
  const label = outputConfig[result.category]?.label || result.categoryLabel;

  return (
    <article className={`insightCard tone-${tone}`}>
      <p className="insightEyebrow">{title}</p>
      <div className="insightHeadline">
        <h3>{label}</h3>
        <div className="insightScore">
          <strong>{result.percent}</strong>
          <span>/100</span>
        </div>
      </div>
      <p className="insightBody">{helper}</p>
    </article>
  );
}

export default function HomePage() {
  const [selections, setSelections] = useState(() => ({ ...defaultSelections }));
  const deferredSelections = useDeferredValue(selections);
  const results = evaluateAxillaryModel(deferredSelections);
  const decisionCopy = selectResultCopy(
    results.finalResult,
    results.nodalResult,
    results.primaryResult,
  );

  function updateSelection(inputId, optionKey) {
    startTransition(() => {
      setSelections((current) => {
        if (current[inputId] === optionKey) {
          return current;
        }

        return {
          ...current,
          [inputId]: optionKey,
        };
      });
    });
  }

  function resetSelections() {
    startTransition(() => {
      setSelections({ ...defaultSelections });
    });
  }

  return (
    <main className="dashboardPage">
      <section className="headlineBand">
        <div className="headlineBandCopy">
          <span className="sectionEyebrow">Panel ozeti</span>
          <h2>Aksiller tutulum icin yeniden kurgulanmis editorial calisma alani</h2>
          <p>
            Giris ve cikislar masaustunde tek bakista okunacak sekilde tek ekranda
            toplandi. Nodal ve primer alt sistemler ayni panel mantigi icinde dogrudan
            final tutulum cikisina baglaniyor.
          </p>
        </div>

        <button type="button" className="resetButton headlineReset" onClick={resetSelections}>
          Varsayilani yukle
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
                  <div className="fieldRow" key={input.id}>
                    <div className="fieldHeader">
                      <h3>{input.name}</h3>
                      <span>
                        {input.range[0]}-{input.range[1]}
                        {input.unit ? ` ${input.unit}` : ""}
                      </span>
                    </div>

                    <div
                      className="choiceGrid"
                      style={{
                        gridTemplateColumns: `repeat(${input.membershipFunctions.length}, minmax(0, 1fr))`,
                      }}
                    >
                      {input.membershipFunctions.map((option) => {
                        const isActive = deferredSelections[input.id] === option.key;

                        return (
                          <button
                            type="button"
                            key={option.key}
                            className={`choiceButton ${isActive ? "choiceButtonActive" : ""}`}
                            aria-pressed={isActive}
                            onClick={() => updateSelection(input.id, option.key)}
                          >
                            <span className="choiceTitle">{option.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </article>
          ))}
        </div>

        <aside className="insightColumn">
          <article className="resultStage">
            <div className="resultStageHeader">
              <div>
                <span className="sectionEyebrow">Canli cikis</span>
                <h2>Genel Tutulum Riski</h2>
              </div>
              <span
                className={`decisionBadge tone-${outputConfig[results.finalResult.category]?.tone || "cool"}`}
              >
                {decisionCopy.badge}
              </span>
            </div>

            <div className="resultStageBody">
              <ScoreFrame
                value={results.finalResult.percent}
                categoryLabel={results.finalResult.categoryLabel}
              />

              <div className="decisionStack">
                <h3>{decisionCopy.headline}</h3>
                <p>{decisionCopy.detail}</p>
                <p className="decisionNarrative">{results.narrative}</p>
              </div>
            </div>
          </article>

          <div className="insightGrid">
            <InsightCard
              title="Nodal Suphe Endeksi"
              result={results.nodalResult}
              helper="Kortikal kalinlik, hilus durumu ve sekil birlikte yorumlanarak nodal suphe bandi olusturuldu."
            />
            <InsightCard
              title="Primer Tumor Risk Endeksi"
              result={results.primaryResult}
              helper="Boyut, kenar paterni ve peritumoral odem birleserek primer tumor davranisini tanimladi."
            />
          </div>
        </aside>
      </section>
    </main>
  );
}
