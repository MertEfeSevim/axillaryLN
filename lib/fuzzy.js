const nodalSystem = {
  inputs: [
    {
      id: "corticalThickness",
      name: "Kortikal Kalinlik",
      variable: "cortical_thickness",
      unit: "mm",
      range: [0, 8],
      membershipFunctions: [
        {
          label: "Ince",
          key: "thin",
          type: "trapmf",
          params: [0, 0, 2, 3],
          helper: "0-3 mm",
        },
        {
          label: "Sinirda",
          key: "borderline",
          type: "trimf",
          params: [2, 3, 4],
          helper: "2-4 mm",
        },
        {
          label: "Kalin",
          key: "thick",
          type: "trapmf",
          params: [3, 4, 8, 8],
          helper: "4-8 mm",
        },
      ],
    },
    {
      id: "fattyHilumStatus",
      name: "Yagli Hilus Durumu",
      variable: "fatty_hilum_status",
      range: [0, 1],
      membershipFunctions: [
        {
          label: "Belirgin",
          key: "present",
          type: "trapmf",
          params: [0, 0, 0.25, 0.5],
        },
        {
          label: "Silik",
          key: "faint",
          type: "trimf",
          params: [0.25, 0.5, 0.75],
        },
        {
          label: "Kayip",
          key: "absent",
          type: "trapmf",
          params: [0.5, 0.75, 1, 1],
        },
      ],
    },
    {
      id: "nodalShape",
      name: "Nodul Sekli",
      variable: "nodal_shape",
      range: [0, 1],
      membershipFunctions: [
        {
          label: "Oval",
          key: "oval",
          type: "trapmf",
          params: [0, 0, 0.45, 0.65],
        },
        {
          label: "Ara Form",
          key: "intermediate",
          type: "trimf",
          params: [0.5, 0.65, 0.8],
        },
        {
          label: "Yuvarlak",
          key: "round",
          type: "trapmf",
          params: [0.65, 0.85, 1, 1],
        },
      ],
    },
  ],
  output: {
    id: "nodalSuspicion",
    name: "Nodal Suphe",
    range: [0, 1],
    membershipFunctions: [
      {
        label: "Dusuk",
        key: "low",
        type: "trapmf",
        params: [0, 0, 0.25, 0.5],
      },
      {
        label: "Orta",
        key: "intermediate",
        type: "trimf",
        params: [0.3, 0.5, 0.7],
      },
      {
        label: "Yuksek",
        key: "high",
        type: "trapmf",
        params: [0.5, 0.75, 1, 1],
      },
    ],
  },
  rules: [
    { antecedent: [1, 1, 1], consequent: 1 },
    { antecedent: [2, 1, 1], consequent: 1 },
    { antecedent: [3, 1, 1], consequent: 2 },
    { antecedent: [1, 2, 1], consequent: 1 },
    { antecedent: [2, 2, 1], consequent: 2 },
    { antecedent: [3, 2, 1], consequent: 2 },
    { antecedent: [1, 3, 1], consequent: 2 },
    { antecedent: [2, 3, 1], consequent: 2 },
    { antecedent: [3, 3, 1], consequent: 3 },
    { antecedent: [1, 1, 2], consequent: 1 },
    { antecedent: [2, 1, 2], consequent: 2 },
    { antecedent: [3, 1, 2], consequent: 2 },
    { antecedent: [1, 2, 2], consequent: 2 },
    { antecedent: [2, 2, 2], consequent: 2 },
    { antecedent: [3, 2, 2], consequent: 3 },
    { antecedent: [1, 3, 2], consequent: 2 },
    { antecedent: [2, 3, 2], consequent: 3 },
    { antecedent: [3, 3, 2], consequent: 3 },
    { antecedent: [1, 1, 3], consequent: 2 },
    { antecedent: [2, 1, 3], consequent: 2 },
    { antecedent: [3, 1, 3], consequent: 3 },
    { antecedent: [1, 2, 3], consequent: 2 },
    { antecedent: [2, 2, 3], consequent: 3 },
    { antecedent: [3, 2, 3], consequent: 3 },
    { antecedent: [1, 3, 3], consequent: 3 },
    { antecedent: [2, 3, 3], consequent: 3 },
    { antecedent: [3, 3, 3], consequent: 3 },
  ],
};

const primarySystem = {
  inputs: [
    {
      id: "tumorSize",
      name: "Tumor Boyutu",
      variable: "tumor_size_mm",
      unit: "mm",
      range: [0, 100],
      membershipFunctions: [
        {
          label: "Kucuk",
          key: "small",
          type: "trapmf",
          params: [0, 0, 20, 30],
          helper: "0-30 mm",
        },
        {
          label: "Orta",
          key: "medium",
          type: "trimf",
          params: [20, 35, 50],
          helper: "20-50 mm",
        },
        {
          label: "Buyuk",
          key: "large",
          type: "trapmf",
          params: [40, 50, 100, 100],
          helper: "40-100 mm",
        },
      ],
    },
    {
      id: "tumorMargin",
      name: "Tumor Kenari",
      variable: "tumor_margin",
      range: [0, 1],
      membershipFunctions: [
        {
          label: "Nonspikule",
          key: "nonspiculated",
          type: "trapmf",
          params: [0, 0, 0.35, 0.6],
        },
        {
          label: "Spikule",
          key: "spiculated",
          type: "trapmf",
          params: [0.4, 0.65, 1, 1],
        },
      ],
    },
    {
      id: "peritumoralEdema",
      name: "Peritumoral Odem",
      variable: "peritumoral_edema",
      range: [0, 1],
      membershipFunctions: [
        {
          label: "Yok",
          key: "absent",
          type: "trapmf",
          params: [0, 0, 0.35, 0.6],
        },
        {
          label: "Var",
          key: "present",
          type: "trapmf",
          params: [0.4, 0.65, 1, 1],
        },
      ],
    },
  ],
  output: {
    id: "primaryTumorRisk",
    name: "Primer Tumor Riski",
    range: [0, 1],
    membershipFunctions: [
      {
        label: "Dusuk",
        key: "low",
        type: "trapmf",
        params: [0, 0, 0.25, 0.5],
      },
      {
        label: "Orta",
        key: "intermediate",
        type: "trimf",
        params: [0.3, 0.5, 0.7],
      },
      {
        label: "Yuksek",
        key: "high",
        type: "trapmf",
        params: [0.5, 0.75, 1, 1],
      },
    ],
  },
  rules: [
    { antecedent: [1, 1, 1], consequent: 1 },
    { antecedent: [2, 1, 1], consequent: 1 },
    { antecedent: [3, 1, 1], consequent: 2 },
    { antecedent: [1, 2, 1], consequent: 1 },
    { antecedent: [2, 2, 1], consequent: 2 },
    { antecedent: [3, 2, 1], consequent: 3 },
    { antecedent: [1, 1, 2], consequent: 1 },
    { antecedent: [2, 1, 2], consequent: 2 },
    { antecedent: [3, 1, 2], consequent: 3 },
    { antecedent: [1, 2, 2], consequent: 2 },
    { antecedent: [2, 2, 2], consequent: 3 },
    { antecedent: [3, 2, 2], consequent: 3 },
  ],
};

const finalSystem = {
  inputs: [
    {
      id: "nodalIn",
      name: "Nodal Girdi",
      range: [0, 1],
      membershipFunctions: [
        {
          label: "Dusuk",
          key: "low",
          type: "trapmf",
          params: [0, 0, 0.25, 0.5],
        },
        {
          label: "Orta",
          key: "intermediate",
          type: "trimf",
          params: [0.3, 0.5, 0.7],
        },
        {
          label: "Yuksek",
          key: "high",
          type: "trapmf",
          params: [0.5, 0.75, 1, 1],
        },
      ],
    },
    {
      id: "primaryIn",
      name: "Primer Girdi",
      range: [0, 1],
      membershipFunctions: [
        {
          label: "Dusuk",
          key: "low",
          type: "trapmf",
          params: [0, 0, 0.25, 0.5],
        },
        {
          label: "Orta",
          key: "intermediate",
          type: "trimf",
          params: [0.3, 0.5, 0.7],
        },
        {
          label: "Yuksek",
          key: "high",
          type: "trapmf",
          params: [0.5, 0.75, 1, 1],
        },
      ],
    },
  ],
  output: {
    id: "axillaryInvolvement",
    name: "Aksiller Tutulum",
    range: [0, 1],
    membershipFunctions: [
      {
        label: "Yok",
        key: "no",
        type: "trapmf",
        params: [0, 0, 0.35, 0.6],
      },
      {
        label: "Var",
        key: "yes",
        type: "trapmf",
        params: [0.4, 0.65, 1, 1],
      },
    ],
  },
  rules: [
    { antecedent: [1, 1], consequent: 1 },
    { antecedent: [2, 1], consequent: 1 },
    { antecedent: [3, 1], consequent: 2 },
    { antecedent: [1, 2], consequent: 1 },
    { antecedent: [2, 2], consequent: 2 },
    { antecedent: [3, 2], consequent: 2 },
    { antecedent: [1, 3], consequent: 2 },
    { antecedent: [2, 3], consequent: 2 },
    { antecedent: [3, 3], consequent: 2 },
  ],
};

function trapmf(value, [a, b, c, d]) {
  if (value <= a || value >= d) {
    if ((value === a && a === b) || (value === d && c === d)) {
      return 1;
    }
  }

  if (value <= a || value >= d) {
    return 0;
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

function membershipValue(value, mf) {
  if (mf.type === "trapmf") {
    return trapmf(value, mf.params);
  }

  return trimf(value, mf.params);
}

function representativeValue(mf) {
  if (mf.type === "trimf") {
    return mf.params[1];
  }

  return (mf.params[1] + mf.params[2]) / 2;
}

function evaluateSystem(system, selectedKeysOrValues, resolution = 801) {
  const crispInputs = Array.isArray(selectedKeysOrValues)
    ? selectedKeysOrValues
    : system.inputs.map((input) => {
        const selected = input.membershipFunctions.find(
          (mf) => mf.key === selectedKeysOrValues[input.id],
        );
        return selected ? representativeValue(selected) : representativeValue(input.membershipFunctions[0]);
      });

  const fuzzifiedInputs = system.inputs.map((input, inputIndex) =>
    input.membershipFunctions.map((mf) => membershipValue(crispInputs[inputIndex], mf)),
  );

  const [rangeStart, rangeEnd] = system.output.range;
  const step = (rangeEnd - rangeStart) / (resolution - 1);
  const aggregated = Array.from({ length: resolution }, (_, pointIndex) => {
    const x = rangeStart + pointIndex * step;

    return system.rules.reduce((currentMax, rule) => {
      const activation = rule.antecedent.reduce((currentMin, mfIndex, antecedentIndex) => {
        const degree = fuzzifiedInputs[antecedentIndex][mfIndex - 1];
        return Math.min(currentMin, degree);
      }, 1);

      const outputMf = system.output.membershipFunctions[rule.consequent - 1];
      const clipped = Math.min(activation, membershipValue(x, outputMf));
      return Math.max(currentMax, clipped);
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

  const crisp = peakXs.reduce((sum, x) => sum + x, 0) / peakXs.length;
  const outputMemberships = system.output.membershipFunctions.map((mf) => ({
    key: mf.key,
    label: mf.label,
    degree: membershipValue(crisp, mf),
  }));
  const topLabel = outputMemberships.reduce((best, current) =>
    current.degree > best.degree ? current : best,
  );

  return {
    crisp,
    percent: Math.round(crisp * 100),
    category: topLabel.key,
    categoryLabel: topLabel.label,
    outputMemberships,
  };
}

function summaryText(finalResult, nodalResult, primaryResult) {
  if (finalResult.category === "yes") {
    if (nodalResult.category === "high" && primaryResult.category === "high") {
      return "En supheli lenf nodu ve primer kitle birlikte yuksek risk bandinda. Aksiller tutulum lehine kuvvetli bir bulanık mantık deseni oluştu.";
    }

    if (nodalResult.category === "high") {
      return "Tutulum karari nodal morfolojinin baskin etkisiyle pozitif yone kaydi. Lenf nodu bulgulari primer kitleden daha agir basiyor.";
    }

    if (primaryResult.category === "high") {
      return "Primer kitlenin agresif goruntuleme ozellikleri toplam riski yukseltti. Aksiller tutulum cikisi pozitif bandda.";
    }

    return "Ara risk bantlarinin birlikte birikmesi tutulum sonucunu pozitif tarafa itti.";
  }

  if (nodalResult.category === "low" && primaryResult.category === "low") {
    return "Hem nodal hem primer alt sistemler dusuk risk bandinda. Sistem aksiller tutulum lehine kuvvetli bir isaret gormuyor.";
  }

  return "Alt sistemlerden biri ara riskte kalsa da toplam cikis negatif bandda. Klinik yorumlama icin goruntuleme baglami ile birlikte okunmali.";
}

export const fuzzyModel = {
  nodalSystem,
  primarySystem,
  finalSystem,
};

export const defaultSelections = {
  corticalThickness: "borderline",
  fattyHilumStatus: "faint",
  nodalShape: "intermediate",
  tumorSize: "medium",
  tumorMargin: "nonspiculated",
  peritumoralEdema: "absent",
};

export function evaluateAxillaryModel(selections) {
  const nodalResult = evaluateSystem(nodalSystem, selections);
  const primaryResult = evaluateSystem(primarySystem, selections);
  const finalResult = evaluateSystem(finalSystem, [nodalResult.crisp, primaryResult.crisp]);

  return {
    nodalResult,
    primaryResult,
    finalResult,
    narrative: summaryText(finalResult, nodalResult, primaryResult),
  };
}
