"use client";

import {
  Fragment,
  startTransition,
  useDeferredValue,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  createDefaultSelections,
  evaluateAxillaryModel,
  fuzzyUiConfig,
  loadFuzzyModel,
  sanitizeNumericSelection,
} from "@/lib/fuzzy";
import {
  DEFAULT_LANGUAGE,
  LANGUAGES,
  createTranslator,
  readStoredLanguage,
  storeLanguage,
} from "@/lib/i18n";

const ARCHIVE_KEY = "axillaryLN.archive";

const SYSTEM_IDS = ["nodalSystem", "primarySystem"];

function formatMembershipShape(membershipFunction) {
  return `${membershipFunction.type} [${membershipFunction.params.join(", ")}]`;
}

function formatSavedAt(isoDate) {
  const date = new Date(isoDate);
  const pad = (value) => String(value).padStart(2, "0");

  return `${pad(date.getDate())}.${pad(date.getMonth() + 1)}.${date.getFullYear()} ${pad(
    date.getHours(),
  )}:${pad(date.getMinutes())}`;
}

function readArchive() {
  try {
    const stored = JSON.parse(window.localStorage.getItem(ARCHIVE_KEY) || "[]");
    return Array.isArray(stored) ? stored : [];
  } catch {
    return [];
  }
}

function writeArchive(entries) {
  try {
    window.localStorage.setItem(ARCHIVE_KEY, JSON.stringify(entries));
  } catch {
    // depolama kapali olabilir; liste yine de oturum boyunca calisir
  }
}

// Kayitlar dilden bagimsiz tutulur: degisken adi yerine FIS anahtari, etiket
// yerine uyelik anahtari saklanir; boylece arsiv secili dilde okunur.
function buildEntry(model, selections, results) {
  const inputs = [...model.nodalSystem.inputs, ...model.primarySystem.inputs].map((input) => ({
    name: input.id,
    mode: input.mode,
    unit: input.unit,
    value:
      input.mode === "numeric"
        ? sanitizeNumericSelection(input, selections[input.id])
        : selections[input.id],
  }));

  const asScore = (result) => ({
    name: result.outputName,
    value: result.displayValue,
    level: result.category,
  });

  return {
    id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
    savedAt: new Date().toISOString(),
    inputs,
    nodal: asScore(results.nodalResult),
    primary: asScore(results.primaryResult),
    final: asScore(results.finalResult),
    positive: results.decision.isPositive,
  };
}

function archiveInputValue(t, input) {
  if (input.mode === "numeric") {
    return input.unit ? `${input.value} ${input.unit}` : input.value;
  }

  // Eski kayitlarda mod saklanmadi; sayisal degerler zaten birimiyle yazilmisti
  // ve bilinmeyen anahtar cevirmenden oldugu gibi geri doner.
  return t.term(input.name, input.value);
}

function RichText({ parts }) {
  return parts.map((part, index) =>
    typeof part === "string" ? (
      <Fragment key={index}>{part}</Fragment>
    ) : (
      <code key={index}>{part.code}</code>
    ),
  );
}

function Info({ label, align = "start", below = false, sheet = false, children }) {
  return (
    <button
      type="button"
      className={`info info--${align}${below ? " info--below" : ""}${sheet ? " info--sheet" : ""}`}
      aria-label={label}
      onClick={(event) => event.preventDefault()}
    >
      i<span className="tip">{children}</span>
    </button>
  );
}

function LanguageSwitch({ language, t, onSelect }) {
  return (
    <div className="seg seg--lang" role="group" aria-label={t.ui.languageLabel}>
      {LANGUAGES.map((option) => (
        <button
          type="button"
          key={option.code}
          className="segBtn"
          aria-pressed={language === option.code}
          aria-label={option.name}
          onClick={() => onSelect(option.code)}
        >
          {option.short}
        </button>
      ))}
    </div>
  );
}

function MembershipTip({ input, t }) {
  return (
    <>
      <b>
        {t.variable(input.id)} &middot; {input.range[0]}-{input.range[1]}
        {input.unit ? ` ${input.unit}` : ""}
      </b>
      <span className="tipRow">
        {t.ui.variable}
        <code>{input.id}</code>
      </span>
      {input.membershipFunctions.map((membershipFunction) => (
        <span className="tipRow" key={membershipFunction.key}>
          {t.term(input.id, membershipFunction.key)}
          <code>{formatMembershipShape(membershipFunction)}</code>
        </span>
      ))}
    </>
  );
}

function Field({ input, value, t, onSelect, onNumericBlur }) {
  const name = t.variable(input.id);

  return (
    <div className="field">
      <div className="fieldName">
        <span>{name}</span>
        <Info label={t.ui.membershipInfoLabel(name)}>
          <MembershipTip input={input} t={t} />
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
              {t.term(input.id, membershipFunction.key)}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function SubScore({ result, t }) {
  return (
    <div className="sub">
      <span>{t.variable(result.outputName)}</span>
      <strong>{result.displayValue}</strong>
      <em className="level" data-level={result.category}>
        {t.level(result.category)}
      </em>
    </div>
  );
}

function ArchiveRow({ entry, t, onRemove }) {
  return (
    <li className="archiveRow">
      <span className="archiveWhen">{formatSavedAt(entry.savedAt)}</span>
      <strong className="archiveScore">{entry.final.value}</strong>
      <span className="level" data-level={entry.final.level}>
        {t.level(entry.final.level)}
      </span>
      <span className="verdict" data-positive={entry.positive}>
        {t.verdict(entry.positive)}
      </span>
      <Info label={t.ui.archiveRowInfo} sheet>
        <b>{formatSavedAt(entry.savedAt)}</b>
        {entry.inputs.map((input) => (
          <span className="tipRow" key={input.name}>
            {t.variable(input.name)}
            <code>{archiveInputValue(t, input)}</code>
          </span>
        ))}
        {[entry.nodal, entry.primary].map((score) => (
          <span className="tipRow" key={score.name}>
            {t.variable(score.name)}
            <code>
              {score.value} {t.level(score.level)}
            </code>
          </span>
        ))}
      </Info>
      <button
        type="button"
        className="rowDel"
        aria-label={t.ui.deleteEntry}
        onClick={() => onRemove(entry.id)}
      >
        &times;
      </button>
    </li>
  );
}

export default function HomePage() {
  const [view, setView] = useState("calc");
  const [language, setLanguage] = useState(DEFAULT_LANGUAGE);
  const [archive, setArchive] = useState([]);
  const [justSaved, setJustSaved] = useState(false);

  const [model, setModel] = useState(null);
  const [selections, setSelections] = useState(null);
  const [loadError, setLoadError] = useState("");

  const t = useMemo(() => createTranslator(language), [language]);

  useEffect(() => {
    setLanguage(readStoredLanguage());
    setArchive(readArchive());
  }, []);

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

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

  useEffect(() => {
    if (!justSaved) {
      return undefined;
    }

    const timer = setTimeout(() => setJustSaved(false), 1600);
    return () => clearTimeout(timer);
  }, [justSaved]);

  const deferredSelections = useDeferredValue(selections);
  const results =
    model && deferredSelections ? evaluateAxillaryModel(model, deferredSelections) : null;

  function selectLanguage(nextLanguage) {
    setLanguage(storeLanguage(nextLanguage));
  }

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

  function saveEntry() {
    if (!model || !selections || !results) {
      return;
    }

    const next = [buildEntry(model, selections, results), ...archive];
    setArchive(next);
    writeArchive(next);
    setJustSaved(true);
  }

  function removeEntry(entryId) {
    const next = archive.filter((entry) => entry.id !== entryId);
    setArchive(next);
    writeArchive(next);
  }

  if (loadError) {
    return (
      <main className="page">
        <p className="notice">
          <b>{t.ui.loadErrorTitle}</b>
          {loadError}
        </p>
      </main>
    );
  }

  if (!model || !selections || !results) {
    return (
      <main className="page">
        <p className="notice">{t.ui.loading}</p>
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
          <p>{t.ui.tagline}</p>
        </div>

        <div className="topbarActions">
          <LanguageSwitch language={language} t={t} onSelect={selectLanguage} />

          {view === "calc" ? (
            <>
              <Info label={t.ui.modelInfoLabel} align="end" below>
                <b>{t.ui.modelInfoTitle}</b>
                <span>{t.ui.modelInfoBody}</span>
                <span>
                  <RichText parts={t.ui.modelInfoDefuzz(threshold.toFixed(2))} />
                </span>
              </Info>
              <button type="button" className="ghostBtn" onClick={resetSelections}>
                {t.ui.reset}
              </button>
              <button type="button" className="ghostBtn" onClick={() => setView("archive")}>
                {t.ui.archive}
                {archive.length ? ` (${archive.length})` : ""}
              </button>
              <button type="button" className="primaryBtn" onClick={saveEntry}>
                {justSaved ? t.ui.saved : t.ui.save}
              </button>
            </>
          ) : (
            <button type="button" className="ghostBtn" onClick={() => setView("calc")}>
              {t.ui.backToCalc}
            </button>
          )}
        </div>
      </header>

      {view === "archive" ? (
        <section className="archive">
          <div className="archiveHead">
            <h2>{t.ui.archive}</h2>
            <span>{t.ui.archiveCount(archive.length)}</span>
          </div>

          {archive.length === 0 ? (
            <p className="notice">{t.ui.archiveEmpty}</p>
          ) : (
            <ul className="archiveList">
              {archive.map((entry) => (
                <ArchiveRow key={entry.id} entry={entry} t={t} onRemove={removeEntry} />
              ))}
            </ul>
          )}
        </section>
      ) : (
        <div className="layout">
          <div className="inputs">
            {SYSTEM_IDS.map((systemId) => {
              const system = model[systemId];

              return (
                <section className="group" key={systemId}>
                  <div className="groupHead">
                    <h2>{t.group(systemId)}</h2>
                    <Info label={t.ui.systemInfoLabel(system.fileName)}>
                      <b>{system.fileName}</b>
                      <span className="tipRow">
                        {t.ui.ruleCount}
                        <code>{system.rules.length}</code>
                      </span>
                      <span className="tipRow">
                        {t.ui.defuzzification}
                        <code>{system.defuzzMethod}</code>
                      </span>
                      <span className="tipRow">
                        {t.ui.output}
                        <code>{system.output.name}</code>
                      </span>
                    </Info>
                  </div>

                  {system.inputs.map((input) => (
                    <Field
                      key={input.id}
                      input={input}
                      value={selections[input.id]}
                      t={t}
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
                {t.variable(finalResult.outputName)}
                <Info label={t.ui.resultInfoLabel} align="end" below>
                  <b>{t.ui.resultInfoTitle}</b>
                  <span>
                    <RichText
                      parts={t.ui.resultInfoFlow(
                        nodalResult.outputName,
                        primaryResult.outputName,
                        model.finalSystem.fileName,
                      )}
                    />
                  </span>
                  <span>
                    <RichText parts={t.ui.resultInfoLevel(threshold.toFixed(2))} />
                  </span>
                </Info>
              </span>
              <span className="verdict" data-positive={decision.isPositive}>
                {t.verdict(decision.isPositive)}
              </span>
            </div>

            <div className="score">
              <span className="scoreNum">{finalResult.displayValue}</span>
              <span className="level" data-level={finalResult.category}>
                {t.level(finalResult.category)}
              </span>
            </div>

            <div className="gauge" data-positive={decision.isPositive}>
              <span className="gaugeFill" style={{ width: `${toPercent(finalResult.crisp)}%` }} />
              <span
                className="gaugeMark"
                data-label={t.ui.thresholdMark(threshold.toFixed(2))}
                style={{ left: `${toPercent(threshold)}%` }}
              />
            </div>

            <div className="subs">
              <SubScore result={nodalResult} t={t} />
              <SubScore result={primaryResult} t={t} />
            </div>
          </section>
        </div>
      )}

      <footer className="sources">
        <b>{t.ui.sources}</b>
        {fuzzyUiConfig.referenceFiles.map((file) => (
          <a key={file.fileName} href={file.url} target="_blank" rel="noreferrer">
            {file.fileName}
          </a>
        ))}
      </footer>
    </main>
  );
}
