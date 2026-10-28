# PolyPlan Application Helper

This is a local, review-first Chrome/Edge extension, not a universal auto-apply service. It never submits, navigates through an application, clicks consent, or marks applications as applied. A webpage cannot fill a different company's website; this extension requests access only to the tab you explicitly activate it on.

## Install (Chrome or Edge on Mac)

1. Pull this repository locally.
2. Open `chrome://extensions` (or `edge://extensions`). Turn on Developer mode.
3. Select **Load unpacked**, then choose this repository's **extension** folder.
4. Pin **PolyPlan Application Helper** to your toolbar.
5. In PolyPlan → Internships → My profile, save your details and download the private autofill JSON. Import it into the extension. Choose your actual résumé PDF/Word file in the extension if you want upload assistance.
6. Open the actual application form. Click the extension → Scan this application. Review each proposed answer; uncheck any you do not want filled. Select Fill selected fields.
7. Review and complete the employer's page manually, submit yourself, and mark Applied in PolyPlan only after submission is confirmed.

No account or API credentials are needed. Profile and résumé are stored in `chrome.storage.local`, not synced to a cloud service. Clearing the extension removes them. The downloaded profile contains personal data; never commit it to Git. Reimport after changing your PolyPlan profile. Your uploaded résumé goes only into the selected form's file input; the employer page can then upload it as part of its normal behavior.

## Scope and limitations

Supports clearly labeled standard text inputs, textareas, native selects with exact matching options, and explicitly labeled résumé/CV file inputs. Populated fields are not overwritten. First/last name, email, contact/address details, school, major, degree, graduation month/year, GPA, LinkedIn, GitHub, and portfolio can be matched. Approved custom answers support exact matches and recognized common paraphrases. Similar-meaning suggestions start unchecked, with the source question and reason shown for review. Conflicting answers and unsupported wording stay blank. Authorization, sponsorship, pay, relocation, and other consequential questions require an exact label. Matching uses local rules, not a general AI model. Names are combined only from provided first/last names. No background facts, essays, authorization answers, or experience are inferred from a résumé.

Passwords, consent checkboxes, demographic questions, signatures/attestations, CAPTCHA, and date inputs are left alone. Workday custom widgets, repeated work-history blocks, cross-origin embedded forms, logins, and multi-step flows may require manual entry; scan each new page. A résumé is attached only when the field explicitly says résumé/CV and its accepted types match. The extension doesn't parse PDFs or automatically create work-history entries. Review all results: employer sites can use ambiguous labels or reject programmatic field changes.

This folder loads in Chromium browsers. Safari requires a separately packaged Safari Web Extension using Apple's tooling; this is not a tested Safari build.
