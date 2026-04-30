const MODEL_SOURCES = [
  {
    id: "nodalSystem",
    fileName: "axillaryLN_nodal.fis",
    url: "/fis/axillaryLN_nodal.fis",
  },
  {
    id: "primarySystem",
    fileName: "axillaryLN_primary.fis",
    url: "/fis/axillaryLN_primary.fis",
  },
  {
    id: "finalSystem",
    fileName: "axillaryLN_final.fis",
    url: "/fis/axillaryLN_final.fis",
  },
];

const REFERENCE_FILES = [
  ...MODEL_SOURCES.map(({ fileName, url }) => ({
    fileName,
    url,
    type: "fis",
  })),
  {
    fileName: "axillaryLN_tree.mat",
    url: "/mat/axillaryLN_tree.mat",
    type: "mat",
  },
  {
    fileName: "workspace_updated.mat",
    url: "/mat/workspace_updated.mat",
    type: "mat",
  },
];

const INPUT_MODE_OVERRIDES = {
  cortical_thickness: "numeric",
  fatty_hilum_status: "categorical",
  nodal_shape: "categorical",
  tumor_size_mm: "numeric",
  tumor_margin: "categorical",
  peritumoral_edema: "categorical",
};

const INPUT_STEPS = {
  cortical_thickness: 0.1,
  tumor_size_mm: 1,
};

const INPUT_UNITS = {
  cortical_thickness: "mm",
  tumor_size_mm: "mm",
};

const RESULT_TONES = {
  low: "cool",
  intermediate: "warm",
  high: "hot",
  no: "cool",
  yes: "hot",
};

let cachedModelPromise = null;

function stripQuotes(value) {
  return value.replace(/^'/, "").replace(/'$/, "");
}

function parseRange(value) {
  return value
    .replace(/^\[/, "")
    .replace(/\]$/, "")
    .trim()
    .split(/\s+/)
    .map(Number);
}

function parseMembershipFunction(line) {
  const match = line.match(/^MF\d+='([^']+)':'([^']+)',\[(.+)\]$/);

  if (!match) {
    return null;
  }

  const [, label, type, paramsText] = match;

  return {
    key: label,
    label,
    type,
    params: paramsText
      .trim()
      .split(/[\s,]+/)
      .filter(Boolean)
      .map(Number),
  };
}

function parseRule(line) {
  const match = line.match(/^(.+?),\s*(-?\d+)\s+\(([\d.]+)\)\s*:\s*(\d+)$/);

  if (!match) {
    throw new Error(`Unsupported rule format: ${line}`);
  }

  const [, antecedentText, consequentText, weightText, connectionText] = match;

  return {
    antecedent: antecedentText.trim().split(/\s+/).map(Number),
    consequent: Number(consequentText),
    weight: Number(weightText),
    connection: Number(connectionText),
  };
}

function parseSections(text) {
  const sections = [];
  let currentSection = null;

  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();

    if (!line) {
      continue;
    }

    const sectionMatch = line.match(/^\[(.+)\]$/);

    if (sectionMatch) {
      currentSection = {
        name: sectionMatch[1],
        lines: [],
      };
      sections.push(currentSection);
      continue;
    }

    if (currentSection) {
      currentSection.lines.push(line);
    }
  }

  return sections;
}

function inferInputMode(name, range) {
  if (INPUT_MODE_OVERRIDES[name]) {
    return INPUT_MODE_OVERRIDES[name];
  }

  return range[1] - range[0] > 1 ? "numeric" : "categorical";
}

function inferInputStep(name, mode, range) {
  if (INPUT_STEPS[name]) {
    return INPUT_STEPS[name];
  }

  if (mode !== "numeric") {
    return null;
  }

  return Number.isInteger(range[0]) && Number.isInteger(range[1]) ? 1 : 0.1;
}

function parseVariableSection(section) {
  const attributes = {};
  const membershipFunctions = [];

  for (const line of section.lines) {
    const membership = parseMembershipFunction(line);

    if (membership) {
      membershipFunctions.push(membership);
      continue;
    }

    const [rawKey, rawValue] = line.split("=");

    if (!rawKey || rawValue === undefined) {
      continue;
    }

    attributes[rawKey.trim()] = rawValue.trim();
  }

  const name = stripQuotes(attributes.Name);
  const range = parseRange(attributes.Range);
  const mode = inferInputMode(name, range);

  return {
    id: name,
    name,
    variable: name,
    range,
    unit: INPUT_UNITS[name] || null,
    mode,
    step: inferInputStep(name, mode, range),
    membershipFunctions,
  };
}

function parseOutputSection(section) {
  const output = parseVariableSection(section);

  return {
    ...output,
    mode: "numeric",
  };
}

function parseFis(text, source) {
  const sections = parseSections(text);
  const systemSection = sections.find((section) => section.name === "System");
  const ruleSection = sections.find((section) => section.name === "Rules");

  if (!systemSection || !ruleSection) {
    throw new Error(`Invalid FIS file: ${source.fileName}`);
  }

  const systemAttributes = {};

  for (const line of systemSection.lines) {
    const [rawKey, rawValue] = line.split("=");

    if (!rawKey || rawValue === undefined) {
      continue;
    }

    systemAttributes[rawKey.trim()] = rawValue.trim();
  }

  const inputs = sections
    .filter((section) => /^Input\d+$/.test(section.name))
    .sort(
      (left, right) => Number(left.name.replace("Input", "")) - Number(right.name.replace("Input", "")),
    )
    .map(parseVariableSection);

  const outputs = sections
    .filter((section) => /^Output\d+$/.test(section.name))
    .sort(
      (left, right) =>
        Number(left.name.replace("Output", "")) - Number(right.name.replace("Output", "")),
    )
    .map(parseOutputSection);

  return {
    id: source.id,
    fileName: source.fileName,
    sourceUrl: source.url,
    name: stripQuotes(systemAttributes.Name),
    type: stripQuotes(systemAttributes.Type),
    defuzzMethod: stripQuotes(systemAttributes.DefuzzMethod),
    inputs,
    output: outputs[0],
    rules: ruleSection.lines.map(parseRule),
  };
}

function trapmf(value, [a, b, c, d]) {
  if (value < a || value > d) {
    return 0;
  }

  if ((value === a && a === b) || (value === d && c === d)) {
    return 1;
  }

  if (value >= b && value <= c) {
    return 1;
  }

  if (value > a && value < b) {
    return (value - a) / (b - a || 1);
  }

  if (value > c && value < d) {
    return (d - value) / (d - c || 1);
  }

  return 0;
}

function trimf(value, [a, b, c]) {
  if (value <= a || value >= c) {
    return 0;
  }

  if (value === b) {
    return 1;
  }

  if (value > a && value < b) {
    return (value - a) / (b - a || 1);
  }

  return (c - value) / (c - b || 1);
}

function membershipValue(value, membershipFunction) {
  if (membershipFunction.type === "trapmf") {
    return trapmf(value, membershipFunction.params);
  }

  return trimf(value, membershipFunction.params);
}

function representativeValue(membershipFunction) {
  if (membershipFunction.type === "trimf") {
    return membershipFunction.params[1];
  }

  return (membershipFunction.params[1] + membershipFunction.params[2]) / 2;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function stepDecimals(step) {
  if (!Number.isFinite(step)) {
    return 0;
  }

  const fraction = String(step).split(".")[1];
  return fraction ? fraction.length : 0;
}

function roundToStep(value, step) {
  if (!step) {
    return value;
  }

  return Math.round(value / step) * step;
}

function formatNumericValue(value, step) {
  const decimals = stepDecimals(step);
  return Number.parseFloat(value.toFixed(decimals)).toString();
}

function defaultNumericSelection(input) {
  const fallbackIndex = input.membershipFunctions.length > 1 ? 1 : 0;
  const membershipFunction = input.membershipFunctions[fallbackIndex];
  const step = input.step || 0.1;
  const value = roundToStep(representativeValue(membershipFunction), step);
  return formatNumericValue(value, step);
}

function defaultCategoricalSelection(input) {
  const index = input.membershipFunctions.length === 2 ? 0 : Math.floor(input.membershipFunctions.length / 2);
  return input.membershipFunctions[index].key;
}

function clampNumericSelection(input, rawValue) {
  const numericValue = Number(rawValue);

  if (!Number.isFinite(numericValue)) {
    return Number(defaultNumericSelection(input));
  }

  return clamp(numericValue, input.range[0], input.range[1]);
}

function resolveInputValue(input, rawValue) {
  if (input.mode === "numeric") {
    return clampNumericSelection(input, rawValue);
  }

  const selectedMembership = input.membershipFunctions.find(
    (membershipFunction) => membershipFunction.key === rawValue,
  );

  return selectedMembership
    ? representativeValue(selectedMembership)
    : representativeValue(input.membershipFunctions[0]);
}

function antecedentDegree(ruleValue, degrees) {
  if (ruleValue === 0) {
    return 1;
  }

  const baseDegree = degrees[Math.abs(ruleValue) - 1] || 0;
  return ruleValue < 0 ? 1 - baseDegree : baseDegree;
}

function evaluateSystem(system, selectedValues, resolution = 1001) {
  const crispInputs = Array.isArray(selectedValues)
    ? selectedValues
    : system.inputs.map((input) => resolveInputValue(input, selectedValues[input.id]));

  const fuzzifiedInputs = system.inputs.map((input, inputIndex) =>
    input.membershipFunctions.map((membershipFunction) =>
      membershipValue(crispInputs[inputIndex], membershipFunction),
    ),
  );

  const [rangeStart, rangeEnd] = system.output.range;
  const step = (rangeEnd - rangeStart) / (resolution - 1);

  const aggregated = Array.from({ length: resolution }, (_, pointIndex) => {
    const x = rangeStart + pointIndex * step;

    return system.rules.reduce((currentMaximum, rule) => {
      const antecedentDegrees = rule.antecedent.map((ruleValue, antecedentIndex) =>
        antecedentDegree(ruleValue, fuzzifiedInputs[antecedentIndex]),
      );

      const activation =
        rule.connection === 2
          ? Math.max(...antecedentDegrees)
          : Math.min(...antecedentDegrees);

      const outputMembership = system.output.membershipFunctions[rule.consequent - 1];
      const clipped = Math.min(activation * rule.weight, membershipValue(x, outputMembership));

      return Math.max(currentMaximum, clipped);
    }, 0);
  });

  const peak = Math.max(...aggregated);
  const peakXs = aggregated
    .map((degree, index) => ({
      degree,
      x: rangeStart + index * step,
    }))
    .filter((item) => Math.abs(item.degree - peak) < 1e-9)
    .map((item) => item.x);

  const crisp = peakXs.length
    ? peakXs.reduce((sum, value) => sum + value, 0) / peakXs.length
    : rangeStart;

  const outputMemberships = system.output.membershipFunctions.map((membershipFunction) => ({
    key: membershipFunction.key,
    label: membershipFunction.label,
    degree: membershipValue(crisp, membershipFunction),
  }));

  const topMembership = outputMemberships.reduce((best, current) =>
    current.degree > best.degree ? current : best,
  );

  return {
    crisp,
    displayValue: crisp.toFixed(3),
    category: topMembership.key,
    categoryLabel: topMembership.label,
    range: system.output.range,
    outputName: system.output.name,
    outputMemberships,
  };
}

function summaryText(nodalResult, primaryResult, finalResult) {
  return [
    `${nodalResult.outputName}=${nodalResult.displayValue} (${nodalResult.categoryLabel})`,
    `${primaryResult.outputName}=${primaryResult.displayValue} (${primaryResult.categoryLabel})`,
    `${finalResult.outputName}=${finalResult.displayValue} (${finalResult.categoryLabel})`,
  ].join(" | ");
}

export async function loadFuzzyModel() {
  if (!cachedModelPromise) {
    cachedModelPromise = Promise.all(
      MODEL_SOURCES.map(async (source) => {
        const response = await fetch(source.url, { cache: "force-cache" });

        if (!response.ok) {
          throw new Error(`Unable to load ${source.fileName}`);
        }

        const text = await response.text();
        return parseFis(text, source);
      }),
    ).then((systems) => {
      const byId = Object.fromEntries(systems.map((system) => [system.id, system]));

      return {
        nodalSystem: byId.nodalSystem,
        primarySystem: byId.primarySystem,
        finalSystem: byId.finalSystem,
      };
    });
  }

  return cachedModelPromise;
}

export function createDefaultSelections(model) {
  return [...model.nodalSystem.inputs, ...model.primarySystem.inputs].reduce(
    (selections, input) => ({
      ...selections,
      [input.id]:
        input.mode === "numeric"
          ? defaultNumericSelection(input)
          : defaultCategoricalSelection(input),
    }),
    {},
  );
}

export function sanitizeNumericSelection(input, rawValue) {
  const clampedValue = roundToStep(clampNumericSelection(input, rawValue), input.step || 0.1);
  return formatNumericValue(clampedValue, input.step || 0.1);
}

export function evaluateAxillaryModel(model, selections) {
  const nodalResult = evaluateSystem(model.nodalSystem, selections);
  const primaryResult = evaluateSystem(model.primarySystem, selections);
  const finalResult = evaluateSystem(model.finalSystem, [nodalResult.crisp, primaryResult.crisp]);

  return {
    nodalResult,
    primaryResult,
    finalResult,
    narrative: summaryText(nodalResult, primaryResult, finalResult),
  };
}

export const fuzzyUiConfig = {
  referenceFiles: REFERENCE_FILES,
  resultTones: RESULT_TONES,
};
