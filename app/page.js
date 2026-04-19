"use client";

import { startTransition, useDeferredValue, useState } from "react";
import { defaultSelections, evaluateAxillaryModel, fuzzyModel } from "@/lib/fuzzy";

const navigationItems = ["Panel", "Hasta Gecmisi", "Karar Kayitlari"];
const totalRules =
  fuzzyModel.nodalSystem.rules.length +
  fuzzyModel.primarySystem.rules.length +
  fuzzyModel.finalSystem.rules.length;

const systemStats = [
  { label: "Alt sistem", value: "3" },
  { label: "Toplam kural", value: String(totalRules) },
  { label: "Defuzzification", value: "MOM" },
];

const inputGroups = [
  {
    id: "nodal",
    eyebrow: "En supheli lenf nodu",
    title: "Nodal Morfoloji",
    description:
      "Kortikal kalinlik, yagli hilus durumu ve nodul seklini gercek fuzzy uyelikleriyle isaretleyin.",
    inputs: fuzzyModel.nodalSystem.inputs,
  },
  {
    id: "primary",
    eyebrow: "Primer lezyon",
    title: "Tumor Ozellikleri",
    description:
      "Tumor boyutu, kenar paternleri ve peritumoral odemi birlikte okuyarak primer risk cikisini uretin.",
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

const riskLabels = [
  { key: "low", label: "Dusuk" },
  { key: "intermediate", label: "Orta" },
  { key: "high", label: "Yuksek" },
];

const finalLabels = [
  { key: "no", label: "Tutulum Yok" },
  { key: "yes", label: "Tutulum Var" },
];

function getSelectedOption(input, selections) {
  return (
    input.membershipFunctions.find((option) => option.key === selections[input.id]) ||
    input.membershipFunctions[0]
  );
}

function summarizeSelections(inputs, selections) {
  return inputs
    .map((input) => {
      const option = getSelectedOption(input, selections);
      return `${input.name}: ${option.label}`;
    })
    .join(" · ");
}

function selectResultCopy(finalResult, nodalResult, primaryResult) {
  if (finalResult.category === "yes") {
    if (nodalResult.category === "high" && primaryResult.category === "high") {
      return {
        badge: "Pozitif",
        headline: "Yuksek tutulum olasiligi",
        detail:
          "Her iki alt sistem de yuksek banda yaslandigi icin son Mamdani cikisi aksiller tutulum lehine belirgin sekilde yukseliyor.",
      };
    }

    if (nodalResult.category === "high") {
      return {
        badge: "Pozitif",
        headline: "Nodal baskin pozitif desen",
        detail:
          "En supheli lenf nodunun morfolojik paterni primer girdiden daha baskin calisiyor ve final cikisi pozitif yonde tutuyor.",
      };
    }

    if (primaryResult.category === "high") {
      return {
        badge: "Pozitif",
        headline: "Primer risk sonucu yukseltiyor",
        detail:
          "Agresif primer tumor paterni, nodal cikis sinirda kalsa bile final tutulum skorunu pozitif banda tasiyor.",
      };
    }

    return {
      badge: "Pozitif",
      headline: "Ara riskler birikerek pozitiflesiyor",
      detail:
        "Keskin tek bir surucu olmasa da ara bantlarin ust uste binmesi final karari tutulum lehine kaydiriyor.",
    };
  }

  if (nodalResult.category === "high" || primaryResult.category === "high") {
    return {
      badge: "Negatif",
      headline: "Sinirda ama halen negatif",
      detail:
        "Alt sistemlerden biri yuksek banda yaklassa da bilesik kural tabani final cikisi halen negatif tarafta tutuyor.",
    };
  }

  return {
    badge: "Negatif",
    headline: "Dusuk tutulum olasiligi",
    detail:
      "Nodal ve primer girdiler birlikte okundugunda toplam risk paterni negatif bandi destekliyor ve genel cikis asagida kaliyor.",
  };
}

function ScoreFrame({ value, categoryLabel }) {
  const safeValue = Math.max(0, Math.min(100, value));
  const stop = Math.max(16, Math.round(safeValue * 3.6));

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

function FuzzyBar({ value, startLabel, endLabel }) {
  const safeValue = Math.max(0, Math.min(100, value));

  return (
    <div className="fuzzyBarBlock">
      <div className="fuzzyBarTrack">
        <span className="fuzzyBarMarker" style={{ left: `${safeValue}%` }} />
      </div>
      <div className="fuzzyBarLabels">
        <span>{startLabel}</span>
        <span>{endLabel}</span>
      </div>
    </div>
  );
}

function CategoryRail({ result, labels }) {
  return (
    <div className="categoryRail">
      {labels.map((item) => {
        const isActive = item.key === result.category;
        const tone = outputConfig[item.key]?.tone || "cool";

        return (
          <div
            className={`categoryToken ${isActive ? `isActive tone-${tone}` : ""}`}
            key={item.key}
          >
            <span>{item.label}</span>
          </div>
        );
      })}
    </div>
  );
}

function InsightCard({ title, result, helper, context, labels }) {
  const tone = outputConfig[result.category]?.tone || "cool";
  const label = outputConfig[result.category]?.label || result.categoryLabel;

  return (
    <article className={`insightCard tone-${tone}`}>
      <div className="insightCardHeader">
        <div>
          <p className="insightEyebrow">{title}</p>
          <h3>{label}</h3>
        </div>
        <div className="insightScore">
          <strong>{result.percent}</strong>
          <span>/100</span>
        </div>
      </div>

      <CategoryRail result={result} labels={labels} />
      <p className="insightBody">{helper}</p>
      <p className="insightContext">{context}</p>
    </article>
  );
}

export default function HomePage() {
  const [selections, setSelections] = useState(() => ({ ...defaultSelections }));
  const deferredSelections = useDeferredValue(selections);
  const results = evaluateAxillaryModel(deferredSelections);
  const isRefreshing = deferredSelections !== selections;
  const decisionCopy = selectResultCopy(
    results.finalResult,
    results.nodalResult,
    results.primaryResult,
  );
  const nodalSummary = summarizeSelections(inputGroups[0].inputs, deferredSelections);
  const primarySummary = summarizeSelections(inputGroups[1].inputs, deferredSelections);
  const signalChips = inputGroups.flatMap((group) =>
    group.inputs.map((input) => {
      const option = getSelectedOption(input, deferredSelections);

      return `${input.name}: ${option.label}`;
    }),
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
      <header className="topBar">
        <div className="brandBlock">
          <p className="brandEyebrow">Klinik karar destek arayuzu</p>
          <div className="brandLockup">
            <h1>Klinik Mimar | NodeInsight</h1>
            <span>AxillaryLN Mamdani sistemi</span>
          </div>
        </div>

        <nav className="topNav" aria-label="Ana sekmeler">
          {navigationItems.map((item, index) => (
            <button
              type="button"
              className={`navButton ${index === 0 ? "isActive" : ""}`}
              key={item}
            >
              {item}
            </button>
          ))}
        </nav>

        <div className="topMeta">
          <span className="metaPill">MOM</span>
          <span className="metaPill">{totalRules} Kural</span>
          <span className="metaPill isLive">
            {isRefreshing ? "Hesaplaniyor" : "Canli"}
          </span>
        </div>
      </header>

      <section className="dashboardGrid">
        <div className="inputColumn">
          <article className="introCard">
            <div className="introCopy">
              <span className="sectionEyebrow">Panel</span>
              <h2>Aksiller tutulum icin yeniden kurgulanmis editorial calisma alani</h2>
              <p>
                Nodal morfoloji ve primer tumor davranisi once iki ayri alt sistemde
                degerlendirilir, ardindan birlesik tutulum cikisina tasinir. Girdiler
                dogrudan fuzzy uyelik kurallarina baglidir.
              </p>
            </div>

            <div className="statsGrid">
              {systemStats.map((item) => (
                <div className="statCard" key={item.label}>
                  <span>{item.label}</span>
                  <strong>{item.value}</strong>
                </div>
              ))}
            </div>
          </article>

          {inputGroups.map((group) => (
            <article className="sectionCard" key={group.id}>
              <div className="sectionHeader">
                <div>
                  <span className="sectionEyebrow">{group.eyebrow}</span>
                  <h2>{group.title}</h2>
                </div>
                <p>{group.description}</p>
              </div>

              <div className="fieldStack">
                {group.inputs.map((input) => {
                  const selected = getSelectedOption(input, deferredSelections);

                  return (
                    <article className="fieldCard" key={input.id}>
                      <div className="fieldHeader">
                        <div>
                          <div className="fieldTitleRow">
                            <h3>{input.name}</h3>
                            <span className="fieldSelection">{selected.label}</span>
                          </div>
                          <p>
                            {input.variable}
                            {" · "}
                            {input.range[0]}-{input.range[1]}
                            {input.unit ? ` ${input.unit}` : ""}
                          </p>
                        </div>
                      </div>

                      <div className="choiceGrid">
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
                              {option.helper ? (
                                <small>{option.helper}</small>
                              ) : (
                                <small>Uyelik secimi</small>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </article>
                  );
                })}
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
              <button type="button" className="resetButton" onClick={resetSelections}>
                Varsayilani yukle
              </button>
            </div>

            <div className="resultStageBody">
              <ScoreFrame
                value={results.finalResult.percent}
                categoryLabel={results.finalResult.categoryLabel}
              />

              <div className="decisionStack">
                <span
                  className={`decisionBadge tone-${outputConfig[results.finalResult.category]?.tone || "cool"}`}
                >
                  {decisionCopy.badge}
                </span>
                <h3>{decisionCopy.headline}</h3>
                <p>{decisionCopy.detail}</p>
                <p className="decisionNarrative">{results.narrative}</p>
              </div>
            </div>

            <FuzzyBar
              value={results.finalResult.percent}
              startLabel="Tutulum Yok"
              endLabel="Tutulum Var"
            />

            <div className="resultMetaGrid">
              <div className="metaCard">
                <span>Canli durum</span>
                <strong>{isRefreshing ? "Model guncelleniyor" : "Model guncel"}</strong>
              </div>
              <div className="metaCard">
                <span>Kural seti</span>
                <strong>{totalRules} toplam kural</strong>
              </div>
              <div className="metaCard">
                <span>Defuzzification</span>
                <strong>Mean of maxima</strong>
              </div>
            </div>
          </article>

          <div className="insightGrid">
            <InsightCard
              title="Nodal Suphe Endeksi"
              result={results.nodalResult}
              helper="Kortikal kalinlik, hilus paterni ve sekil birlikte yorumlanarak nodal risk bandi olusturuldu."
              context={nodalSummary}
              labels={riskLabels}
            />
            <InsightCard
              title="Primer Tumor Risk Endeksi"
              result={results.primaryResult}
              helper="Boyut, kenar yapisi ve peritumoral odem bileserek primer tumor davranisini tanimladi."
              context={primarySummary}
              labels={riskLabels}
            />
          </div>

          <article className="narrativePanel">
            <div className="sectionHeader narrativeHeader">
              <div>
                <span className="sectionEyebrow">Kural okuma notu</span>
                <h2>Bulanik mantik izi</h2>
              </div>
              <p>
                Secili uyelikler alttaki akista iki ara cikisa, oradan da final aksiller
                tutulum kararina baglanir. Kartlar secili paterni klinik okumaya uygun
                sekilde ozetler.
              </p>
            </div>

            <div className="signalCloud">
              {signalChips.map((item) => (
                <span className="signalChip" key={item}>
                  {item}
                </span>
              ))}
            </div>

            <div className="stageGrid">
              <article className="stageCard">
                <span>01 · Nodal</span>
                <strong>{outputConfig[results.nodalResult.category]?.label}</strong>
                <p>3 girdi · 27 kural · {results.nodalResult.percent}/100</p>
              </article>
              <article className="stageCard">
                <span>02 · Primer</span>
                <strong>{outputConfig[results.primaryResult.category]?.label}</strong>
                <p>3 girdi · 12 kural · {results.primaryResult.percent}/100</p>
              </article>
              <article className="stageCard">
                <span>03 · Final</span>
                <strong>{outputConfig[results.finalResult.category]?.label}</strong>
                <p>2 ara cikis · 9 kural · {results.finalResult.percent}/100</p>
              </article>
            </div>

            <CategoryRail result={results.finalResult} labels={finalLabels} />
          </article>
        </aside>
      </section>
    </main>
  );
}
