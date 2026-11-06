# axillaryLN Fuzzy Workspace

Browser-based research and reproducibility interface for the axillary lymph-node fuzzy inference model.

> **Research use only — not for clinical use.** This software is not a medical device and must not be used for clinical decision-making, diagnosis, or patient management.

## Model files

The interface calculates results locally from these locked V3 Mamdani FIS files:

- `public/fis/axillaryLN_nodal_v3.fis`
- `public/fis/axillaryLN_primary_v3.fis`
- `public/fis/axillaryLN_final_v3.fis`

The nodal and primary-tumour systems each produce a score; those scores are the inputs to the final system.

## Numeric inputs and range handling

| Input | Model range |
| --- | --- |
| Cortical thickness | 0–20 mm |
| Short-axis diameter | 0–30 mm |
| Tumour size | 0–100 mm |

Blank, invalid, and negative numeric values are rejected. Values above a model range are calculated at the nearest upper boundary and visibly flagged in the interface. The interface also flags a cortical thickness greater than the short-axis diameter as a measurement-consistency warning.

## Data handling

Inputs and model calculations run in the browser. The application does not send entered values to a server or database. If a visitor uses **Save**, the saved run is stored only in that browser profile's local storage (`axillaryLN.archive`). Do not enter directly identifying patient information.

## Live interface

[https://axillary-ln.vercel.app](https://axillary-ln.vercel.app)

## License

This project is released under the [MIT License](LICENSE).
