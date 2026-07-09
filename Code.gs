/**
 * Code.gs — infrastructure/base layer.
 *
 * Contains legacy-compatible spreadsheet setup, sheet formatting,
 * maintenance utilities, and infrastructure helpers. Public Apps Script
 * entry points are preserved; internal helper names remain backward-compatible.
 */

const מזהה_הגיליון = "1ovsZH2dt-DMqVrRcamcxns2p8pTaeKPtu9bfEn-yKzU";


/***** 01 הגדרה והקמה בסיסית *****/

function הקמת_מערכת_סרמ() {
  const קובץ = SpreadsheetApp.openById(מזהה_הגיליון);

  const מבנה = {
    "פרויקטים": [
      "מזהה פרויקט",
      "שם הפרויקט",
      "תחום / סיווג פרויקט",
      "סטטוס",
      "אנשי קשר משויכים"
    ],
    "אנשי קשר": [
      "מזהה איש קשר",
      "שם מלא",
      "מספר טלפון",
      "כתובת אימייל",
      "כתובת מגורים / משרד",
      "מקור הגעה",
      "סטטוס לקוח",
      "פרויקטים משויכים"
    ],
    "שיוך פרויקטים ואנשי קשר": [
      "מזהה שיוך",
      "מזהה פרויקט",
      "מזהה איש קשר",
      "תפקיד / הערה"
    ],
    "הגדרות": [
      "סוג הגדרה",
      "ערך"
    ],
    "יומן מערכת": [
      "תאריך ושעה",
      "פעולה",
      "פירוט"
    ]
  };

  Object.keys(מבנה).forEach(שם_גיליון => {
    let גיליון = קובץ.getSheetByName(שם_גיליון);
    if (!גיליון) גיליון = קובץ.insertSheet(שם_גיליון);

    גיליון.clear();
    גיליון.setRightToLeft(true);

    const כותרות = מבנה[שם_גיליון];
    גיליון.getRange(1, 1, 1, כותרות.length).setValues([כותרות]);

    גיליון.setFrozenRows(1);
    גיליון.getRange(1, 1, 1, כותרות.length)
      .setFontWeight("bold")
      .setBackground("#1f4e79")
      .setFontColor("#ffffff")
      .setHorizontalAlignment("center");

    גיליון.autoResizeColumns(1, כותרות.length);
  });

  מילוי_הגדרות_ראשוני_(קובץ);
  רענון_רשימות_בחירה_(קובץ);
  רישום_ביומן_(קובץ, "הקמת מערכת", "מערכת CRM סרמ נדל״ן הוקמה בעברית מלאה");
}

function מילוי_הגדרות_ראשוני_(קובץ) {
  const גיליון = קובץ.getSheetByName("הגדרות");

  const ערכים = [
    ["תחום / סיווג פרויקט", "יזמות / התחדשות"],
    ["תחום / סיווג פרויקט", "ליווי משקיעים"],
    ["תחום / סיווג פרויקט", "ייעוץ / אחר"],

    ["סטטוס פרויקט", "ללא סיווג"],
    ["סטטוס פרויקט", "בדיקת היתכנות"],
    ["סטטוס פרויקט", "משא ומתן"],
    ["סטטוס פרויקט", "בדיקה משפטית ותכנונית"],
    ["סטטוס פרויקט", "מימון ובנקים"],
    ["סטטוס פרויקט", "ביצוע ובנייה / סגירה"],

    ["מקור הגעה", "פייסבוק"],
    ["מקור הגעה", "אתר"],
    ["מקור הגעה", "מפה לאוזן"],

    ["סטטוס לקוח", "ליד חדש"],
    ["סטטוס לקוח", "משקיע פוטנציאלי"],
    ["סטטוס לקוח", "לקוח פעיל"]
  ];

  גיליון.getRange(2, 1, ערכים.length, 2).setValues(ערכים);
  גיליון.autoResizeColumns(1, 2);
}

function רענון_רשימות_בחירה_(קובץ) {
  קביעת_רשימת_בחירה_(קובץ, "פרויקטים", 3, "תחום / סיווג פרויקט");
  קביעת_רשימת_בחירה_(קובץ, "פרויקטים", 4, "סטטוס פרויקט");

  קביעת_רשימת_בחירה_(קובץ, "אנשי קשר", 6, "מקור הגעה");
  קביעת_רשימת_בחירה_(קובץ, "אנשי קשר", 7, "סטטוס לקוח");
}

function קביעת_רשימת_בחירה_(קובץ, שם_גיליון, מספר_עמודה, סוג_הגדרה) {
  const גיליון = קובץ.getSheetByName(שם_גיליון);
  const הגדרות = קובץ.getSheetByName("הגדרות");

  const ערכים = הגדרות.getDataRange().getValues()
    .filter(שורה => שורה[0] === סוג_הגדרה)
    .map(שורה => שורה[1])
    .filter(String);

  const כלל = SpreadsheetApp.newDataValidation()
    .requireValueInList(ערכים, true)
    .setAllowInvalid(false)
    .build();

  גיליון.getRange(2, מספר_עמודה, גיליון.getMaxRows() - 1).setDataValidation(כלל);
}

function רישום_ביומן_(קובץ, פעולה, פירוט) {
  const גיליון = קובץ.getSheetByName("יומן מערכת");
  גיליון.appendRow([new Date(), פעולה, פירוט]);
}


/***** 02 כרטיסים וטפסים *****/

function הקמת_כרטיסים() {
  const קובץ = SpreadsheetApp.openById(מזהה_הגיליון);

  הקמת_כרטיס_פרויקט_(קובץ);
  הקמת_כרטיס_איש_קשר_(קובץ);

  רישום_ביומן_(קובץ, "הקמת כרטיסים", "נוצרו כרטיס פרויקט וכרטיס איש קשר");
}

function הקמת_כרטיס_פרויקט_(קובץ) {
  let גיליון = קובץ.getSheetByName("כרטיס פרויקט");
  if (!גיליון) גיליון = קובץ.insertSheet("כרטיס פרויקט");

  גיליון.clear();
  גיליון.setRightToLeft(true);
  גיליון.setColumnWidths(1, 1, 180);
  גיליון.setColumnWidths(2, 1, 320);
  גיליון.setColumnWidths(4, 3, 180);

  גיליון.getRange("A1:B1").merge()
    .setValue("כרטיס פרויקט")
    .setFontSize(18)
    .setFontWeight("bold")
    .setBackground("#1f4e79")
    .setFontColor("#ffffff")
    .setHorizontalAlignment("center");

  const שדות = [
    ["בחר מזהה פרויקט", ""],
    ["שם הפרויקט", ""],
    ["תחום / סיווג פרויקט", ""],
    ["סטטוס", ""],
    ["אנשי קשר משויכים", ""]
  ];

  גיליון.getRange(3, 1, שדות.length, 2).setValues(שדות);
  גיליון.getRange("A3:A7").setFontWeight("bold").setBackground("#d9eaf7");

  const פרויקטים = קובץ.getSheetByName("פרויקטים");
  const כלל = SpreadsheetApp.newDataValidation()
    .requireValueInRange(פרויקטים.getRange("A2:A"), true)
    .setAllowInvalid(false)
    .build();

  גיליון.getRange("B3").setDataValidation(כלל);

  גיליון.getRange("B4").setFormula('=IFERROR(INDEX(פרויקטים!B:B,MATCH(B3,פרויקטים!A:A,0)),"")');
  גיליון.getRange("B5").setFormula('=IFERROR(INDEX(פרויקטים!C:C,MATCH(B3,פרויקטים!A:A,0)),"")');
  גיליון.getRange("B6").setFormula('=IFERROR(INDEX(פרויקטים!D:D,MATCH(B3,פרויקטים!A:A,0)),"")');
  גיליון.getRange("B7").setFormula('=IFERROR(INDEX(פרויקטים!E:E,MATCH(B3,פרויקטים!A:A,0)),"")');

  גיליון.getRange("D1:F1").merge()
    .setValue("שיוכים לפרויקט")
    .setFontWeight("bold")
    .setBackground("#1f4e79")
    .setFontColor("#ffffff")
    .setHorizontalAlignment("center");

  גיליון.getRange("D3:F3").setValues([["מזהה שיוך", "מזהה איש קשר", "תפקיד / הערה"]])
    .setFontWeight("bold")
    .setBackground("#d9eaf7");

  גיליון.getRange("D4").setFormula(
    '=IFERROR(FILTER(\'שיוך פרויקטים ואנשי קשר\'!A:D,\'שיוך פרויקטים ואנשי קשר\'!B:B=B3),"")'
  );
}

function הקמת_כרטיס_איש_קשר_(קובץ) {
  let גיליון = קובץ.getSheetByName("כרטיס איש קשר");
  if (!גיליון) גיליון = קובץ.insertSheet("כרטיס איש קשר");

  גיליון.clear();
  גיליון.setRightToLeft(true);
  גיליון.setColumnWidths(1, 1, 180);
  גיליון.setColumnWidths(2, 1, 320);
  גיליון.setColumnWidths(4, 3, 180);

  גיליון.getRange("A1:B1").merge()
    .setValue("כרטיס איש קשר")
    .setFontSize(18)
    .setFontWeight("bold")
    .setBackground("#1f4e79")
    .setFontColor("#ffffff")
    .setHorizontalAlignment("center");

  const שדות = [
    ["בחר מזהה איש קשר", ""],
    ["שם מלא", ""],
    ["מספר טלפון", ""],
    ["כתובת אימייל", ""],
    ["כתובת מגורים / משרד", ""],
    ["מקור הגעה", ""],
    ["סטטוס לקוח", ""],
    ["פרויקטים משויכים", ""]
  ];

  גיליון.getRange(3, 1, שדות.length, 2).setValues(שדות);
  גיליון.getRange("A3:A10").setFontWeight("bold").setBackground("#d9eaf7");

  const אנשי_קשר = קובץ.getSheetByName("אנשי קשר");
  const כלל = SpreadsheetApp.newDataValidation()
    .requireValueInRange(אנשי_קשר.getRange("A2:A"), true)
    .setAllowInvalid(false)
    .build();

  גיליון.getRange("B3").setDataValidation(כלל);

  גיליון.getRange("B4").setFormula('=IFERROR(INDEX(\'אנשי קשר\'!B:B,MATCH(B3,\'אנשי קשר\'!A:A,0)),"")');
  גיליון.getRange("B5").setFormula('=IFERROR(INDEX(\'אנשי קשר\'!C:C,MATCH(B3,\'אנשי קשר\'!A:A,0)),"")');
  גיליון.getRange("B6").setFormula('=IFERROR(INDEX(\'אנשי קשר\'!D:D,MATCH(B3,\'אנשי קשר\'!A:A,0)),"")');
  גיליון.getRange("B7").setFormula('=IFERROR(INDEX(\'אנשי קשר\'!E:E,MATCH(B3,\'אנשי קשר\'!A:A,0)),"")');
  גיליון.getRange("B8").setFormula('=IFERROR(INDEX(\'אנשי קשר\'!F:F,MATCH(B3,\'אנשי קשר\'!A:A,0)),"")');
  גיליון.getRange("B9").setFormula('=IFERROR(INDEX(\'אנשי קשר\'!G:G,MATCH(B3,\'אנשי קשר\'!A:A,0)),"")');
  גיליון.getRange("B10").setFormula('=IFERROR(INDEX(\'אנשי קשר\'!H:H,MATCH(B3,\'אנשי קשר\'!A:A,0)),"")');

  גיליון.getRange("D1:F1").merge()
    .setValue("שיוכים לאיש קשר")
    .setFontWeight("bold")
    .setBackground("#1f4e79")
    .setFontColor("#ffffff")
    .setHorizontalAlignment("center");

  גיליון.getRange("D3:F3").setValues([["מזהה שיוך", "מזהה פרויקט", "תפקיד / הערה"]])
    .setFontWeight("bold")
    .setBackground("#d9eaf7");

  גיליון.getRange("D4").setFormula(
    '=IFERROR(FILTER(\'שיוך פרויקטים ואנשי קשר\'!A:D,\'שיוך פרויקטים ואנשי קשר\'!C:C=B3),"")'
  );
}

function הקמת_טפסי_הוספה() {
  const קובץ = SpreadsheetApp.openById(מזהה_הגיליון);

  הקמת_טופס_פרויקט_(קובץ);
  הקמת_טופס_איש_קשר_(קובץ);

  רישום_ביומן_(קובץ, "הקמת טפסים", "נוצרו טפסי הוספה לפרויקט ולאיש קשר");
}

function הקמת_טופס_פרויקט_(קובץ) {
  let גיליון = קובץ.getSheetByName("הוספת פרויקט");
  if (!גיליון) גיליון = קובץ.insertSheet("הוספת פרויקט");

  גיליון.clear();
  גיליון.setRightToLeft(true);
  גיליון.setColumnWidths(1, 1, 220);
  גיליון.setColumnWidths(2, 1, 360);

  גיליון.getRange("A1:B1").merge()
    .setValue("הוספת פרויקט חדש")
    .setFontSize(18)
    .setFontWeight("bold")
    .setBackground("#1f4e79")
    .setFontColor("#ffffff")
    .setHorizontalAlignment("center");

  const שדות = [
    ["שם הפרויקט", ""],
    ["תחום / סיווג פרויקט", ""],
    ["סטטוס", ""],
    ["אנשי קשר משויכים", ""]
  ];

  גיליון.getRange(3, 1, שדות.length, 2).setValues(שדות);
  גיליון.getRange("A3:A6").setFontWeight("bold").setBackground("#d9eaf7");

  קביעת_רשימת_בחירה_בטופס_(קובץ, גיליון, "B4", "תחום / סיווג פרויקט");
  קביעת_רשימת_בחירה_בטופס_(קובץ, גיליון, "B5", "סטטוס פרויקט");

  גיליון.getRange("A8:B8").merge()
    .setValue("לאחר מילוי הפרטים, הרץ את הפונקציה: שמירת_פרויקט_חדש")
    .setBackground("#fff2cc")
    .setHorizontalAlignment("center");
}

function הקמת_טופס_איש_קשר_(קובץ) {
  let גיליון = קובץ.getSheetByName("הוספת איש קשר");
  if (!גיליון) גיליון = קובץ.insertSheet("הוספת איש קשר");

  גיליון.clear();
  גיליון.setRightToLeft(true);
  גיליון.setColumnWidths(1, 1, 220);
  גיליון.setColumnWidths(2, 1, 360);

  גיליון.getRange("A1:B1").merge()
    .setValue("הוספת איש קשר חדש")
    .setFontSize(18)
    .setFontWeight("bold")
    .setBackground("#1f4e79")
    .setFontColor("#ffffff")
    .setHorizontalAlignment("center");

  const שדות = [
    ["שם מלא", ""],
    ["מספר טלפון", ""],
    ["כתובת אימייל", ""],
    ["כתובת מגורים / משרד", ""],
    ["מקור הגעה", ""],
    ["סטטוס לקוח", ""],
    ["פרויקטים משויכים", ""]
  ];

  גיליון.getRange(3, 1, שדות.length, 2).setValues(שדות);
  גיליון.getRange("A3:A9").setFontWeight("bold").setBackground("#d9eaf7");

  קביעת_רשימת_בחירה_בטופס_(קובץ, גיליון, "B7", "מקור הגעה");
  קביעת_רשימת_בחירה_בטופס_(קובץ, גיליון, "B8", "סטטוס לקוח");

  גיליון.getRange("A11:B11").merge()
    .setValue("לאחר מילוי הפרטים, הרץ את הפונקציה: שמירת_איש_קשר_חדש")
    .setBackground("#fff2cc")
    .setHorizontalAlignment("center");
}

function קביעת_רשימת_בחירה_בטופס_(קובץ, גיליון, תא, סוג_הגדרה) {
  const הגדרות = קובץ.getSheetByName("הגדרות");

  const ערכים = הגדרות.getDataRange().getValues()
    .filter(שורה => שורה[0] === סוג_הגדרה)
    .map(שורה => שורה[1])
    .filter(String);

  const כלל = SpreadsheetApp.newDataValidation()
    .requireValueInList(ערכים, true)
    .setAllowInvalid(false)
    .build();

  גיליון.getRange(תא).setDataValidation(כלל);
}


/***** 03 שמירה וזיהוי *****/

function שמירת_פרויקט_חדש() {
  const קובץ = SpreadsheetApp.openById(מזהה_הגיליון);
  const טופס = קובץ.getSheetByName("הוספת פרויקט");
  const פרויקטים = קובץ.getSheetByName("פרויקטים");

  const שם = טופס.getRange("B3").getValue();
  const עיר = טופס.getRange("B5").getValue();
  const תחום = טופס.getRange("B6").getValue();
  const סטטוס = טופס.getRange("B7").getValue();
  const אנשי_קשר = טופס.getRange("B8").getValue();

  if (!שם) throw new Error("חסר שם פרויקט");

  פרויקטים.appendRow([
    יצירת_מזהה_("פר"),
    שם,
    עיר,
    תחום,
    סטטוס,
    אנשי_קשר
  ]);

  טופס.getRange("B3:B8").clearContent();

  רישום_ביומן_(קובץ, "שמירת פרויקט חדש", שם);
}

function שמירת_איש_קשר_חדש() {
  const קובץ = SpreadsheetApp.openById(מזהה_הגיליון);
  const טופס = קובץ.getSheetByName("הוספת איש קשר");
  const אנשי_קשר = קובץ.getSheetByName("אנשי קשר");

  const שם = טופס.getRange("B3").getValue();
  const טלפון = טופס.getRange("B4").getValue();
  const אימייל = טופס.getRange("B5").getValue();
  const כתובת = טופס.getRange("B6").getValue();
  const מקור = טופס.getRange("B7").getValue();
  const סטטוס = טופס.getRange("B8").getValue();
  const פרויקטים = טופס.getRange("B9").getValue();

  if (!שם) {
    throw new Error("חסר שם איש קשר");
  }

  אנשי_קשר.appendRow([
    יצירת_מזהה_("איש"),
    שם,
    טלפון,
    אימייל,
    כתובת,
    מקור,
    סטטוס,
    פרויקטים
  ]);

  טופס.getRange("B3:B9").clearContent();

  רישום_ביומן_(קובץ, "שמירת איש קשר חדש", שם);
}

function יצירת_מזהה_(קידומת) {
  return קידומת + "-" +
    Utilities.getUuid()
      .substring(0, 8)
      .toUpperCase();
}

function הקמת_טופס_שיוך() {
  const קובץ = SpreadsheetApp.openById(מזהה_הגיליון);

  let גיליון = קובץ.getSheetByName("שיוך חדש");
  if (!גיליון) גיליון = קובץ.insertSheet("שיוך חדש");

  גיליון.clear();
  גיליון.setRightToLeft(true);
  גיליון.setColumnWidths(1, 1, 220);
  גיליון.setColumnWidths(2, 1, 360);

  גיליון.getRange("A1:B1").merge()
    .setValue("שיוך איש קשר לפרויקט")
    .setFontSize(18)
    .setFontWeight("bold")
    .setBackground("#1f4e79")
    .setFontColor("#ffffff")
    .setHorizontalAlignment("center");

  const שדות = [
    ["בחר פרויקט", ""],
    ["בחר איש קשר", ""],
    ["סוג קשר / תפקיד", ""],
    ["הערה", ""],
    ["מורשה צפייה בפורטל", ""]
  ];

  גיליון.getRange(3, 1, שדות.length, 2).setValues(שדות);
  גיליון.getRange("A3:A7").setFontWeight("bold").setBackground("#d9eaf7");

  const פרויקטים = קובץ.getSheetByName("פרויקטים");
  const אנשי_קשר = קובץ.getSheetByName("אנשי קשר");

  const כלל_פרויקטים = SpreadsheetApp.newDataValidation()
    .requireValueInRange(פרויקטים.getRange("A2:A"), true)
    .setAllowInvalid(false)
    .build();

  const כלל_אנשי_קשר = SpreadsheetApp.newDataValidation()
    .requireValueInRange(אנשי_קשר.getRange("A2:A"), true)
    .setAllowInvalid(false)
    .build();

  const כלל_תפקיד = SpreadsheetApp.newDataValidation()
    .requireValueInList([
      "משקיע",
      "לקוח",
      "שותף",
      "יזם",
      "מתווך",
      "עו״ד",
      "שמאי",
      "אדריכל",
      "בנק",
      "קבלן",
      "ספק",
      "אחר"
    ], true)
    .setAllowInvalid(false)
    .build();

  const כלל_כן_לא = SpreadsheetApp.newDataValidation()
    .requireValueInList(["כן", "לא"], true)
    .setAllowInvalid(false)
    .build();

  גיליון.getRange("B3").setDataValidation(כלל_פרויקטים);
  גיליון.getRange("B4").setDataValidation(כלל_אנשי_קשר);
  גיליון.getRange("B5").setDataValidation(כלל_תפקיד);
  גיליון.getRange("B7").setDataValidation(כלל_כן_לא);

  גיליון.getRange("B7").setValue("לא");

  גיליון.getRange("A9:B9").merge()
    .setValue("לאחר מילוי הפרטים, הרץ את הפונקציה: שמירת_שיוך_חדש")
    .setBackground("#fff2cc")
    .setHorizontalAlignment("center");

  רישום_ביומן_(קובץ, "הקמת טופס שיוך", "נוצר טופס שיוך פרויקט לאיש קשר");
}

function שמירת_שיוך_חדש() {
  const קובץ = SpreadsheetApp.openById(מזהה_הגיליון);
  const טופס = קובץ.getSheetByName("שיוך חדש");
  const שיוכים = קובץ.getSheetByName("שיוך פרויקטים ואנשי קשר");

  const בחירת_פרויקט = טופס.getRange("B3").getValue();
  const בחירת_איש_קשר = טופס.getRange("B4").getValue();

  const מזהה_פרויקט = מזהה_מתוך_בחירה(בחירת_פרויקט);
  const מזהה_איש_קשר = מזהה_מתוך_בחירה(בחירת_איש_קשר);

  const תפקיד = טופס.getRange("B5").getValue();
  const הערה = טופס.getRange("B6").getValue();
  const מורשה_צפייה = טופס.getRange("B7").getValue();

  if (!מזהה_פרויקט) throw new Error("חסר פרויקט");
  if (!מזהה_איש_קשר) throw new Error("חסר איש קשר");

  שיוכים.appendRow([
    יצירת_מזהה_("שיך"),
    מזהה_פרויקט,
    מזהה_איש_קשר,
    תפקיד,
    הערה,
    מורשה_צפייה || "לא"
  ]);

  טופס.getRange("B3:B7").clearContent();
  טופס.getRange("B7").setValue("לא");

  רישום_ביומן_(קובץ, "שמירת שיוך חדש", מזהה_פרויקט + " ↔ " + מזהה_איש_קשר);
}


/***** 04 דשבורד *****/

function הקמת_דשבורד() {
  const קובץ = SpreadsheetApp.openById(מזהה_הגיליון);

  let גיליון = קובץ.getSheetByName("דשבורד");
  if (!גיליון) גיליון = קובץ.insertSheet("דשבורד");

  גיליון.clear();
  גיליון.setRightToLeft(true);

  גיליון.setColumnWidths(1, 8, 160);

  גיליון.getRange("A1:H1").merge()
    .setValue("דשבורד CRM סרמ נדל״ן")
    .setFontSize(20)
    .setFontWeight("bold")
    .setBackground("#1f4e79")
    .setFontColor("#ffffff")
    .setHorizontalAlignment("center");

  גיליון.getRange("A3").setValue("בחר מצב תצוגה:")
    .setFontWeight("bold")
    .setBackground("#d9eaf7");

  גיליון.getRange("B3").setDataValidation(
    SpreadsheetApp.newDataValidation()
      .requireValueInList(["משולב", "פרויקטים בלבד", "אנשי קשר בלבד"], true)
      .setAllowInvalid(false)
      .build()
  ).setValue("משולב");

  גיליון.getRange("A5:B5").merge().setValue("סיכום מהיר")
    .setFontWeight("bold")
    .setBackground("#1f4e79")
    .setFontColor("#ffffff")
    .setHorizontalAlignment("center");

  גיליון.getRange("A6").setValue("מספר פרויקטים");
  גיליון.getRange("B6").setFormula('=COUNTA(פרויקטים!A2:A)');

  גיליון.getRange("A7").setValue("מספר אנשי קשר");
  גיליון.getRange("B7").setFormula('=COUNTA(\'אנשי קשר\'!A2:A)');

  גיליון.getRange("A9:D9").setValues([["פרויקטים", "", "", ""]])
    .setFontWeight("bold")
    .setBackground("#1f4e79")
    .setFontColor("#ffffff");

  גיליון.getRange("A10:D10").setValues([["מזהה פרויקט", "שם הפרויקט", "תחום", "סטטוס"]])
    .setFontWeight("bold")
    .setBackground("#d9eaf7");

  גיליון.getRange("A11").setFormula(
    '=IF(OR($B$3="משולב",$B$3="פרויקטים בלבד"),FILTER(פרויקטים!A:D,פרויקטים!A:A<>""),"")'
  );

  גיליון.getRange("F9:I9").setValues([["אנשי קשר", "", "", ""]])
    .setFontWeight("bold")
    .setBackground("#1f4e79")
    .setFontColor("#ffffff");

  גיליון.getRange("F10:I10").setValues([["מזהה איש קשר", "שם מלא", "טלפון", "אימייל"]])
    .setFontWeight("bold")
    .setBackground("#d9eaf7");

  גיליון.getRange("F11").setFormula(
    '=IF(OR($B$3="משולב",$B$3="אנשי קשר בלבד"),FILTER(\'אנשי קשר\'!A:D,\'אנשי קשר\'!A:A<>""),"")'
  );

  רישום_ביומן_(קובץ, "הקמת דשבורד", "נוצר דשבורד עם בחירת מצב תצוגה");
}


/***** 05 משימות והערות *****/

function הקמת_משימות_והערות() {
  const קובץ = SpreadsheetApp.openById(מזהה_הגיליון);

  הקמת_גיליון_משימות_(קובץ);
  הקמת_גיליון_הערות_משימה_(קובץ);
  הקמת_טופס_משימה_(קובץ);
  הקמת_טופס_הערת_משימה_(קובץ);

  רישום_ביומן_(קובץ, "הקמת משימות והערות", "נוצרו משימות, הערות וטפסי עבודה");
}

function הקמת_גיליון_משימות_(קובץ) {
  let גיליון = קובץ.getSheetByName("משימות");
  if (!גיליון) גיליון = קובץ.insertSheet("משימות");

  גיליון.clear();
  גיליון.setRightToLeft(true);

  const כותרות = [
    "מזהה משימה",
    "סוג",
    "מזהה פרויקט",
    "מזהה איש קשר",
    "כותרת",
    "תאריך",
    "שעת התחלה",
    "שעת סיום",
    "סטטוס",
    "תאריך יצירה",
    "עדכון אחרון",
    "מזהה אירוע ביומן"
  ];

  גיליון.getRange(1, 1, 1, כותרות.length).setValues([כותרות]);
  עיצוב_כותרת_(גיליון, כותרות.length);
}

function הקמת_גיליון_הערות_משימה_(קובץ) {
  let גיליון = קובץ.getSheetByName("הערות משימה");
  if (!גיליון) גיליון = קובץ.insertSheet("הערות משימה");

  גיליון.clear();
  גיליון.setRightToLeft(true);

  const כותרות = [
    "מזהה הערה",
    "מזהה משימה",
    "תאריך ושעת עדכון",
    "הערה"
  ];

  גיליון.getRange(1, 1, 1, כותרות.length).setValues([כותרות]);
  עיצוב_כותרת_(גיליון, כותרות.length);
}

function הקמת_טופס_משימה_(קובץ) {
  let גיליון = קובץ.getSheetByName("הוספת משימה");
  if (!גיליון) גיליון = קובץ.insertSheet("הוספת משימה");

  גיליון.clear();
  גיליון.setRightToLeft(true);
  גיליון.setColumnWidths(1, 1, 220);
  גיליון.setColumnWidths(2, 1, 360);

  גיליון.getRange("A1:B1").merge()
    .setValue("הוספת משימה / פגישה")
    .setFontSize(18)
    .setFontWeight("bold")
    .setBackground("#1f4e79")
    .setFontColor("#ffffff")
    .setHorizontalAlignment("center");

  const שדות = [
    ["סוג", ""],
    ["מזהה פרויקט", ""],
    ["מזהה איש קשר", ""],
    ["כותרת", ""],
    ["תאריך", ""],
    ["שעת התחלה", ""],
    ["שעת סיום", ""],
    ["סטטוס", ""]
  ];

  גיליון.getRange(3, 1, שדות.length, 2).setValues(שדות);
  גיליון.getRange("A3:A10").setFontWeight("bold").setBackground("#d9eaf7");

  const פרויקטים = קובץ.getSheetByName("פרויקטים");
  const אנשי_קשר = קובץ.getSheetByName("אנשי קשר");

  גיליון.getRange("B3").setDataValidation(
    SpreadsheetApp.newDataValidation()
      .requireValueInList(["משימה", "פגישה", "שיחה"], true)
      .setAllowInvalid(false)
      .build()
  );

  גיליון.getRange("B4").setDataValidation(
    SpreadsheetApp.newDataValidation()
      .requireValueInRange(פרויקטים.getRange("A2:A"), true)
      .setAllowInvalid(false)
      .build()
  );

  גיליון.getRange("B5").setDataValidation(
    SpreadsheetApp.newDataValidation()
      .requireValueInRange(אנשי_קשר.getRange("A2:A"), true)
      .setAllowInvalid(false)
      .build()
  );

  גיליון.getRange("B10").setDataValidation(
    SpreadsheetApp.newDataValidation()
      .requireValueInList(["פתוח", "בטיפול", "בוצע", "נדחה", "בוטל"], true)
      .setAllowInvalid(false)
      .build()
  );

  גיליון.getRange("B3").setValue("משימה");
  גיליון.getRange("B10").setValue("פתוח");

  גיליון.getRange("A12:B12").merge()
    .setValue("לאחר מילוי הפרטים, הרץ את הפונקציה: שמירת_משימה_חדשה")
    .setBackground("#fff2cc")
    .setHorizontalAlignment("center");
}

function הקמת_טופס_הערת_משימה_(קובץ) {
  let גיליון = קובץ.getSheetByName("הוספת הערת משימה");
  if (!גיליון) גיליון = קובץ.insertSheet("הוספת הערת משימה");

  גיליון.clear();
  גיליון.setRightToLeft(true);
  גיליון.setColumnWidths(1, 1, 220);
  גיליון.setColumnWidths(2, 1, 420);

  גיליון.getRange("A1:B1").merge()
    .setValue("הוספת הערה למשימה")
    .setFontSize(18)
    .setFontWeight("bold")
    .setBackground("#1f4e79")
    .setFontColor("#ffffff")
    .setHorizontalAlignment("center");

  const שדות = [
    ["מזהה משימה", ""],
    ["הערה", ""]
  ];

  גיליון.getRange(3, 1, שדות.length, 2).setValues(שדות);
  גיליון.getRange("A3:A4").setFontWeight("bold").setBackground("#d9eaf7");

  const משימות = קובץ.getSheetByName("משימות");

  גיליון.getRange("B3").setDataValidation(
    SpreadsheetApp.newDataValidation()
      .requireValueInRange(משימות.getRange("A2:A"), true)
      .setAllowInvalid(false)
      .build()
  );

  גיליון.getRange("B4").setWrap(true);

  גיליון.getRange("A6:B6").merge()
    .setValue("בעת שמירה, תאריך ושעת העדכון יתווספו אוטומטית")
    .setBackground("#fff2cc")
    .setHorizontalAlignment("center");
}

function שמירת_משימה_חדשה() {
  const קובץ = SpreadsheetApp.openById(מזהה_הגיליון);
  const טופס = קובץ.getSheetByName("הוספת משימה");
  const משימות = קובץ.getSheetByName("משימות");

  const סוג = טופס.getRange("B3").getValue();
  const מזהה_פרויקט = טופס.getRange("B4").getValue();
  const מזהה_איש_קשר = טופס.getRange("B5").getValue();
  const כותרת = טופס.getRange("B6").getValue();
  const תאריך = טופס.getRange("B7").getValue();
  const שעת_התחלה = טופס.getRange("B8").getValue();
  const שעת_סיום = טופס.getRange("B9").getValue();
  const סטטוס = טופס.getRange("B10").getValue();

  if (!כותרת) throw new Error("חסרה כותרת משימה");
  if (!תאריך) throw new Error("חסר תאריך");
  if (!מזהה_פרויקט && !מזהה_איש_קשר) {
    throw new Error("יש לשייך את המשימה לפחות לפרויקט או לאיש קשר");
  }

  const עכשיו = new Date();

  משימות.appendRow([
    יצירת_מזהה_("מש"),
    סוג,
    מזהה_פרויקט,
    מזהה_איש_קשר,
    כותרת,
    תאריך,
    שעת_התחלה,
    שעת_סיום,
    סטטוס || "פתוח",
    עכשיו,
    עכשיו,
    ""
  ]);

  טופס.getRange("B4:B9").clearContent();
  טופס.getRange("B3").setValue("משימה");
  טופס.getRange("B10").setValue("פתוח");

  רישום_ביומן_(קובץ, "שמירת משימה חדשה", כותרת);
}

function שמירת_הערת_משימה_חדשה() {
  const קובץ = SpreadsheetApp.openById(מזהה_הגיליון);
  const טופס = קובץ.getSheetByName("הוספת הערת משימה");
  const הערות = קובץ.getSheetByName("הערות משימה");
  const משימות = קובץ.getSheetByName("משימות");

  const מזהה_משימה = טופס.getRange("B3").getValue();
  const הערה = טופס.getRange("B4").getValue();

  if (!מזהה_משימה) throw new Error("חסר מזהה משימה");
  if (!הערה) throw new Error("חסרה הערה");

  const עכשיו = new Date();

  הערות.appendRow([
    יצירת_מזהה_("הע"),
    מזהה_משימה,
    עכשיו,
    הערה
  ]);

  עדכון_תאריך_אחרון_במשימה_(משימות, מזהה_משימה, עכשיו);

  טופס.getRange("B3:B4").clearContent();

  רישום_ביומן_(קובץ, "שמירת הערת משימה", מזהה_משימה);
}

function עדכון_תאריך_אחרון_במשימה_(גיליון_משימות, מזהה_משימה, תאריך) {
  const נתונים = גיליון_משימות.getDataRange().getValues();

  for (let i = 1; i < נתונים.length; i++) {
    if (נתונים[i][0] === מזהה_משימה) {
      גיליון_משימות.getRange(i + 1, 11).setValue(תאריך);
      return;
    }
  }
}


/***** 07 שדרוגי מבנה וטפסים *****/

function שדרוג_בחירת_שעות() {
  const קובץ = SpreadsheetApp.openById(מזהה_הגיליון);

  const שעות = יצירת_רשימת_שעות_();

  const כלל_שעות = SpreadsheetApp.newDataValidation()
    .requireValueInList(שעות, true)
    .setAllowInvalid(false)
    .build();

  const כרטיס_פרויקט = קובץ.getSheetByName("כרטיס פרויקט");
  if (כרטיס_פרויקט) {
    כרטיס_פרויקט.getRange("B13:B14").setDataValidation(כלל_שעות);
  }

  const כרטיס_איש_קשר = קובץ.getSheetByName("כרטיס איש קשר");
  if (כרטיס_איש_קשר) {
    כרטיס_איש_קשר.getRange("B16:B17").setDataValidation(כלל_שעות);
  }

  const הוספת_משימה = קובץ.getSheetByName("הוספת משימה");
  if (הוספת_משימה) {
    הוספת_משימה.getRange("B8:B9").setDataValidation(כלל_שעות);
  }

  רישום_ביומן_(קובץ, "שדרוג בחירת שעות", "נוספה רשימת בחירה לשדות שעה");
}

function יצירת_רשימת_שעות_() {
  const שעות = [];

  for (let שעה = 7; שעה <= 23; שעה++) {
    for (let דקה of [0, 15, 30, 45]) {
      const שעה_טקסט = String(שעה).padStart(2, "0");
      const דקה_טקסט = String(דקה).padStart(2, "0");
      שעות.push(`${שעה_טקסט}:${דקה_טקסט}`);
    }
  }

  return שעות;
}

function הקמת_טופס_עריכת_פרויקט() {
  const קובץ = SpreadsheetApp.openById(מזהה_הגיליון);

  let גיליון = קובץ.getSheetByName("עריכת פרויקט");
  if (!גיליון) גיליון = קובץ.insertSheet("עריכת פרויקט");

  גיליון.clear();
  גיליון.setRightToLeft(true);
  גיליון.setColumnWidths(1, 1, 220);
  גיליון.setColumnWidths(2, 1, 420);

  גיליון.getRange("A1:B1").merge()
    .setValue("עריכת פרויקט קיים")
    .setFontSize(18)
    .setFontWeight("bold")
    .setBackground("#1f4e79")
    .setFontColor("#ffffff")
    .setHorizontalAlignment("center");

  גיליון.getRange("A3:B7").setValues([
    ["בחר מזהה פרויקט", ""],
    ["שם הפרויקט", ""],
    ["תחום / סיווג פרויקט", ""],
    ["סטטוס", ""],
    ["אנשי קשר משויכים", ""]
  ]);

  גיליון.getRange("A3:A7")
    .setFontWeight("bold")
    .setBackground("#d9eaf7");

  const פרויקטים = קובץ.getSheetByName("פרויקטים");

  גיליון.getRange("B3").setDataValidation(
    SpreadsheetApp.newDataValidation()
      .requireValueInRange(פרויקטים.getRange("A2:A"), true)
      .setAllowInvalid(false)
      .build()
  );

  קביעת_רשימת_בחירה_בטופס_(קובץ, גיליון, "B5", "תחום / סיווג פרויקט");
  קביעת_רשימת_בחירה_בטופס_(קובץ, גיליון, "B6", "סטטוס פרויקט");

  גיליון.getRange("A9:B9").merge()
    .setValue("שלב 1: בחר מזהה פרויקט והריץ: טעינת_פרויקט_לעריכה")
    .setBackground("#fff2cc")
    .setHorizontalAlignment("center");

  גיליון.getRange("A10:B10").merge()
    .setValue("שלב 2: לאחר שינוי הפרטים, הרץ: שמירת_עריכת_פרויקט")
    .setBackground("#d9ead3")
    .setHorizontalAlignment("center");

  רישום_ביומן_(קובץ, "הקמת טופס עריכת פרויקט", "נוצר טופס עריכת פרויקט");
}

function טעינת_פרויקט_לעריכה() {
  const קובץ = SpreadsheetApp.openById(מזהה_הגיליון);
  const טופס = קובץ.getSheetByName("עריכת פרויקט");
  const פרויקטים = קובץ.getSheetByName("פרויקטים");

  const בחירה = טופס.getRange("B3").getValue();
  const מזהה = מזהה_מתוך_בחירה(בחירה);

  if (!מזהה) throw new Error("יש לבחור פרויקט");

  // מנקים זמנית אימות נתונים כדי לאפשר טעינת ערכים ישנים
  טופס.getRange("B5:B8").clearDataValidations();

  const נתונים = פרויקטים.getDataRange().getValues();

  for (let i = 1; i < נתונים.length; i++) {
    if (נתונים[i][0] === מזהה) {
      טופס.getRange("B4").setValue(נתונים[i][1]); // שם
      טופס.getRange("B5").setValue(נתונים[i][2]); // עיר
      טופס.getRange("B6").setValue(נתונים[i][3]); // תחום
      טופס.getRange("B7").setValue(נתונים[i][4]); // סטטוס
      טופס.getRange("B8").setValue(נתונים[i][5]); // אנשי קשר

      // מחזירים את רשימות הבחירה הנכונות
      קביעת_רשימת_בחירה_בטופס_(קובץ, טופס, "B6", "תחום / סיווג פרויקט");
      קביעת_רשימת_בחירה_בטופס_(קובץ, טופס, "B7", "סטטוס פרויקט");

      רישום_ביומן_(קובץ, "טעינת פרויקט לעריכה", מזהה);
      return;
    }
  }

  throw new Error("הפרויקט לא נמצא");
}

function שמירת_עריכת_פרויקט() {
  const קובץ = SpreadsheetApp.openById(מזהה_הגיליון);
  const טופס = קובץ.getSheetByName("עריכת פרויקט");
  const פרויקטים = קובץ.getSheetByName("פרויקטים");

  const בחירה = טופס.getRange("B3").getValue();
  const מזהה = מזהה_מתוך_בחירה(בחירה);

  const שם = טופס.getRange("B4").getValue();
  const עיר = טופס.getRange("B5").getValue();
  const תחום = טופס.getRange("B6").getValue();
  const סטטוס = טופס.getRange("B7").getValue();
  const אנשי_קשר = טופס.getRange("B8").getValue();

  if (!מזהה) throw new Error("חסר פרויקט");
  if (!שם) throw new Error("חסר שם פרויקט");

  const נתונים = פרויקטים.getDataRange().getValues();

  for (let i = 1; i < נתונים.length; i++) {
    if (נתונים[i][0] === מזהה) {
      פרויקטים.getRange(i + 1, 2).setValue(שם);
      פרויקטים.getRange(i + 1, 3).setValue(עיר);
      פרויקטים.getRange(i + 1, 4).setValue(תחום);
      פרויקטים.getRange(i + 1, 5).setValue(סטטוס);
      פרויקטים.getRange(i + 1, 6).setValue(אנשי_קשר);

      טופס.getRange("B3:B8").clearContent();
      רישום_ביומן_(קובץ, "שמירת עריכת פרויקט", מזהה);
      return;
    }
  }

  throw new Error("הפרויקט לא נמצא לשמירה");
}

function שדרוג_בחירה_לפי_שם_והוספת_עיר() {
  const קובץ = SpreadsheetApp.openById(מזהה_הגיליון);

  הוספת_עמודת_עיר_לפרויקטים_(קובץ);
  הקמת_רשימות_בחירה_ידידותיות_(קובץ);
  עדכון_טפסים_לבחירה_ידידותית_(קובץ);

  רישום_ביומן_(קובץ, "שדרוג בחירה", "נוספה עיר ובחירה לפי שם + מזהה");
}

function הוספת_עמודת_עיר_לפרויקטים_(קובץ) {
  const גיליון = קובץ.getSheetByName("פרויקטים");
  const כותרות = גיליון.getRange(1, 1, 1, גיליון.getLastColumn()).getValues()[0];

  if (!כותרות.includes("עיר")) {
    גיליון.insertColumnAfter(2);
    גיליון.getRange(1, 3).setValue("עיר");
    גיליון.getRange(1, 1, 1, גיליון.getLastColumn())
      .setFontWeight("bold")
      .setBackground("#1f4e79")
      .setFontColor("#ffffff")
      .setHorizontalAlignment("center");
  }
}

function הקמת_רשימות_בחירה_ידידותיות_(קובץ) {
  let גיליון = קובץ.getSheetByName("רשימות בחירה");
  if (!גיליון) גיליון = קובץ.insertSheet("רשימות בחירה");

  גיליון.clear();
  גיליון.setRightToLeft(true);

  גיליון.getRange("A1").setValue("בחירת פרויקט");
  גיליון.getRange("B1").setValue("מזהה פרויקט");
  גיליון.getRange("D1").setValue("בחירת איש קשר");
  גיליון.getRange("E1").setValue("מזהה איש קשר");

  גיליון.getRange("A2").setFormula(
    '=FILTER(פרויקטים!B2:B&" | "&פרויקטים!C2:C&" | "&פרויקטים!A2:A,פרויקטים!A2:A<>"")'
  );

  גיליון.getRange("B2").setFormula(
    '=FILTER(פרויקטים!A2:A,פרויקטים!A2:A<>"")'
  );

  גיליון.getRange("D2").setFormula(
    '=FILTER(\'אנשי קשר\'!B2:B&" | "&\'אנשי קשר\'!C2:C&" | "&\'אנשי קשר\'!A2:A,\'אנשי קשר\'!A2:A<>"")'
  );

  גיליון.getRange("E2").setFormula(
    '=FILTER(\'אנשי קשר\'!A2:A,\'אנשי קשר\'!A2:A<>"")'
  );

  גיליון.hideSheet();
}

function עדכון_טפסים_לבחירה_ידידותית_(קובץ) {
  const רשימות = קובץ.getSheetByName("רשימות בחירה");

  const כלל_פרויקט = SpreadsheetApp.newDataValidation()
    .requireValueInRange(רשימות.getRange("A2:A"), true)
    .setAllowInvalid(false)
    .build();

  const כלל_איש_קשר = SpreadsheetApp.newDataValidation()
    .requireValueInRange(רשימות.getRange("D2:D"), true)
    .setAllowInvalid(false)
    .build();

  const כרטיס_פרויקט = קובץ.getSheetByName("כרטיס פרויקט");
  if (כרטיס_פרויקט) {
    כרטיס_פרויקט.getRange("A3").setValue("בחר פרויקט");
    כרטיס_פרויקט.getRange("B3").setDataValidation(כלל_פרויקט);
    כרטיס_פרויקט.getRange("B4").setFormula('=IFERROR(INDEX(פרויקטים!B:B,MATCH(מזהה_מתוך_בחירה(B3),פרויקטים!A:A,0)),"")');
    כרטיס_פרויקט.getRange("B5").setFormula('=IFERROR(INDEX(פרויקטים!C:C,MATCH(מזהה_מתוך_בחירה(B3),פרויקטים!A:A,0)),"")');
    כרטיס_פרויקט.getRange("B6").setFormula('=IFERROR(INDEX(פרויקטים!D:D,MATCH(מזהה_מתוך_בחירה(B3),פרויקטים!A:A,0)),"")');
    כרטיס_פרויקט.getRange("B7").setFormula('=IFERROR(INDEX(פרויקטים!E:E,MATCH(מזהה_מתוך_בחירה(B3),פרויקטים!A:A,0)),"")');
  }

  const כרטיס_איש_קשר = קובץ.getSheetByName("כרטיס איש קשר");
  if (כרטיס_איש_קשר) {
    כרטיס_איש_קשר.getRange("A3").setValue("בחר איש קשר");
    כרטיס_איש_קשר.getRange("B3").setDataValidation(כלל_איש_קשר);
  }

  const שיוך = קובץ.getSheetByName("שיוך חדש");
  if (שיוך) {
    שיוך.getRange("B3").setDataValidation(כלל_פרויקט);
    שיוך.getRange("B4").setDataValidation(כלל_איש_קשר);
  }

  const עריכת_פרויקט = קובץ.getSheetByName("עריכת פרויקט");
  if (עריכת_פרויקט) {
    עריכת_פרויקט.getRange("A3").setValue("בחר פרויקט");
    עריכת_פרויקט.getRange("B3").setDataValidation(כלל_פרויקט);
    עריכת_פרויקט.getRange("A5").setValue("עיר");
    עריכת_פרויקט.getRange("A6").setValue("תחום / סיווג פרויקט");
    עריכת_פרויקט.getRange("A7").setValue("סטטוס");
    עריכת_פרויקט.getRange("A8").setValue("אנשי קשר משויכים");
  }

  const הוספת_פרויקט = קובץ.getSheetByName("הוספת פרויקט");
  if (הוספת_פרויקט) {
    הוספת_פרויקט.getRange("A5").setValue("עיר");
    הוספת_פרויקט.getRange("A6").setValue("תחום / סיווג פרויקט");
    הוספת_פרויקט.getRange("A7").setValue("סטטוס");
    הוספת_פרויקט.getRange("A8").setValue("אנשי קשר משויכים");
  }
}

function מזהה_מתוך_בחירה(טקסט) {
  if (!טקסט) return "";
  const חלקים = String(טקסט).split("|");
  return חלקים[חלקים.length - 1].trim();
}

function תיקון_רשימות_בחירה_לאחר_הוספת_עיר() {
  const קובץ = SpreadsheetApp.openById(מזהה_הגיליון);

  const הוספת_פרויקט = קובץ.getSheetByName("הוספת פרויקט");
  if (הוספת_פרויקט) {
    הוספת_פרויקט.getRange("B5").clearDataValidations(); // עיר - טקסט חופשי
    קביעת_רשימת_בחירה_בטופס_(קובץ, הוספת_פרויקט, "B6", "תחום / סיווג פרויקט");
    קביעת_רשימת_בחירה_בטופס_(קובץ, הוספת_פרויקט, "B7", "סטטוס פרויקט");
    הוספת_פרויקט.getRange("B8").clearDataValidations(); // אנשי קשר - כרגע טקסט חופשי
  }

  const עריכת_פרויקט = קובץ.getSheetByName("עריכת פרויקט");
  if (עריכת_פרויקט) {
    עריכת_פרויקט.getRange("B5").clearDataValidations(); // עיר - טקסט חופשי
    קביעת_רשימת_בחירה_בטופס_(קובץ, עריכת_פרויקט, "B6", "תחום / סיווג פרויקט");
    קביעת_רשימת_בחירה_בטופס_(קובץ, עריכת_פרויקט, "B7", "סטטוס פרויקט");
    עריכת_פרויקט.getRange("B8").clearDataValidations(); // אנשי קשר - כרגע טקסט חופשי
  }

  רישום_ביומן_(קובץ, "תיקון רשימות בחירה", "תוקנו רשימות הבחירה לאחר הוספת עיר");
}

function הקמת_טופס_עריכת_איש_קשר() {
  const קובץ = SpreadsheetApp.openById(מזהה_הגיליון);

  let גיליון = קובץ.getSheetByName("עריכת איש קשר");
  if (!גיליון) גיליון = קובץ.insertSheet("עריכת איש קשר");

  גיליון.clear();
  גיליון.setRightToLeft(true);
  גיליון.setColumnWidths(1, 1, 220);
  גיליון.setColumnWidths(2, 1, 420);

  גיליון.getRange("A1:B1").merge()
    .setValue("עריכת איש קשר קיים")
    .setFontSize(18)
    .setFontWeight("bold")
    .setBackground("#1f4e79")
    .setFontColor("#ffffff")
    .setHorizontalAlignment("center");

  גיליון.getRange("A3:B10").setValues([
    ["בחר איש קשר", ""],
    ["שם מלא", ""],
    ["מספר טלפון", ""],
    ["כתובת אימייל", ""],
    ["כתובת מגורים / משרד", ""],
    ["מקור הגעה", ""],
    ["סטטוס לקוח", ""],
    ["פרויקטים משויכים", ""]
  ]);

  גיליון.getRange("A3:A10")
    .setFontWeight("bold")
    .setBackground("#d9eaf7");

  const רשימות = קובץ.getSheetByName("רשימות בחירה");

  גיליון.getRange("B3").setDataValidation(
    SpreadsheetApp.newDataValidation()
      .requireValueInRange(רשימות.getRange("D2:D"), true)
      .setAllowInvalid(false)
      .build()
  );

  קביעת_רשימת_בחירה_בטופס_(קובץ, גיליון, "B8", "מקור הגעה");
  קביעת_רשימת_בחירה_בטופס_(קובץ, גיליון, "B9", "סטטוס לקוח");

  גיליון.getRange("A12:B12").merge()
    .setValue("שלב 1: בחר איש קשר והריץ: טעינת_איש_קשר_לעריכה")
    .setBackground("#fff2cc")
    .setHorizontalAlignment("center");

  גיליון.getRange("A13:B13").merge()
    .setValue("שלב 2: לאחר שינוי הפרטים, הרץ: שמירת_עריכת_איש_קשר")
    .setBackground("#d9ead3")
    .setHorizontalAlignment("center");

  רישום_ביומן_(קובץ, "הקמת טופס עריכת איש קשר", "נוצר טופס עריכת איש קשר");
}

function טעינת_איש_קשר_לעריכה() {
  const קובץ = SpreadsheetApp.openById(מזהה_הגיליון);
  const טופס = קובץ.getSheetByName("עריכת איש קשר");
  const אנשי_קשר = קובץ.getSheetByName("אנשי קשר");

  const בחירה = טופס.getRange("B3").getValue();
  const מזהה = מזהה_מתוך_בחירה(בחירה);

  if (!מזהה) throw new Error("יש לבחור איש קשר");

  טופס.getRange("B8:B10").clearDataValidations();

  const נתונים = אנשי_קשר.getDataRange().getValues();

  for (let i = 1; i < נתונים.length; i++) {
    if (נתונים[i][0] === מזהה) {
      טופס.getRange("B4").setValue(נתונים[i][1]);
      טופס.getRange("B5").setValue(נתונים[i][2]);
      טופס.getRange("B6").setValue(נתונים[i][3]);
      טופס.getRange("B7").setValue(נתונים[i][4]);
      טופס.getRange("B8").setValue(נתונים[i][5]);
      טופס.getRange("B9").setValue(נתונים[i][6]);
      טופס.getRange("B10").setValue(נתונים[i][7]);

      קביעת_רשימת_בחירה_בטופס_(קובץ, טופס, "B8", "מקור הגעה");
      קביעת_רשימת_בחירה_בטופס_(קובץ, טופס, "B9", "סטטוס לקוח");

      רישום_ביומן_(קובץ, "טעינת איש קשר לעריכה", מזהה);
      return;
    }
  }

  throw new Error("איש הקשר לא נמצא");
}

function שמירת_עריכת_איש_קשר() {
  const קובץ = SpreadsheetApp.openById(מזהה_הגיליון);
  const טופס = קובץ.getSheetByName("עריכת איש קשר");
  const אנשי_קשר = קובץ.getSheetByName("אנשי קשר");

  const בחירה = טופס.getRange("B3").getValue();
  const מזהה = מזהה_מתוך_בחירה(בחירה);

  const שם = טופס.getRange("B4").getValue();
  const טלפון = טופס.getRange("B5").getValue();
  const אימייל = טופס.getRange("B6").getValue();
  const כתובת = טופס.getRange("B7").getValue();
  const מקור = טופס.getRange("B8").getValue();
  const סטטוס = טופס.getRange("B9").getValue();
  const פרויקטים = טופס.getRange("B10").getValue();

  if (!מזהה) throw new Error("חסר איש קשר");
  if (!שם) throw new Error("חסר שם איש קשר");

  const נתונים = אנשי_קשר.getDataRange().getValues();

  for (let i = 1; i < נתונים.length; i++) {
    if (נתונים[i][0] === מזהה) {
      אנשי_קשר.getRange(i + 1, 2).setValue(שם);
      אנשי_קשר.getRange(i + 1, 3).setValue(טלפון);
      אנשי_קשר.getRange(i + 1, 4).setValue(אימייל);
      אנשי_קשר.getRange(i + 1, 5).setValue(כתובת);
      אנשי_קשר.getRange(i + 1, 6).setValue(מקור);
      אנשי_קשר.getRange(i + 1, 7).setValue(סטטוס);
      אנשי_קשר.getRange(i + 1, 8).setValue(פרויקטים);

      טופס.getRange("B3:B10").clearContent();
      רישום_ביומן_(קובץ, "שמירת עריכת איש קשר", מזהה);
      return;
    }
  }

  throw new Error("איש הקשר לא נמצא לשמירה");
}

function שדרוג_טופס_שיוך_לבחירה_לפי_שם() {
  const קובץ = SpreadsheetApp.openById(מזהה_הגיליון);

  הקמת_רשימות_בחירה_ידידותיות_(קובץ);

  const גיליון = קובץ.getSheetByName("שיוך חדש");
  const רשימות = קובץ.getSheetByName("רשימות בחירה");

  גיליון.getRange("A3").setValue("בחר פרויקט");
  גיליון.getRange("A4").setValue("בחר איש קשר");

  const כלל_פרויקט = SpreadsheetApp.newDataValidation()
    .requireValueInRange(רשימות.getRange("A2:A"), true)
    .setAllowInvalid(false)
    .build();

  const כלל_איש_קשר = SpreadsheetApp.newDataValidation()
    .requireValueInRange(רשימות.getRange("D2:D"), true)
    .setAllowInvalid(false)
    .build();

  גיליון.getRange("B3").setDataValidation(כלל_פרויקט);
  גיליון.getRange("B4").setDataValidation(כלל_איש_קשר);

  גיליון.getRange("A9:B9").merge()
    .setValue("לאחר בחירה לפי שם, הרץ את הפונקציה: שמירת_שיוך_חדש")
    .setBackground("#fff2cc")
    .setHorizontalAlignment("center");

  רישום_ביומן_(קובץ, "שדרוג טופס שיוך", "טופס השיוך עבר לבחירה לפי שם");
}


/***** 99 פונקציות נוספות שלא סווגו *****/

function עיצוב_כותרת_(גיליון, מספר_עמודות) {
  גיליון.setFrozenRows(1);
  גיליון.getRange(1, 1, 1, מספר_עמודות)
    .setFontWeight("bold")
    .setBackground("#1f4e79")
    .setFontColor("#ffffff")
    .setHorizontalAlignment("center");

  גיליון.autoResizeColumns(1, מספר_עמודות);
}

function שדרוג_משימות_לכרטיסים_ודשבורד() {
  const קובץ = SpreadsheetApp.openById(מזהה_הגיליון);

  הוספת_אזור_משימות_לכרטיס_פרויקט_(קובץ);
  הוספת_אזור_משימות_לכרטיס_איש_קשר_(קובץ);
  שדרוג_דשבורד_משימות_(קובץ);

  רישום_ביומן_(קובץ, "שדרוג משימות", "נוספה הוספת משימות מתוך כרטיסים ודשבורד משימות");
}

function הוספת_אזור_משימות_לכרטיס_פרויקט_(קובץ) {
  const גיליון = קובץ.getSheetByName("כרטיס פרויקט");

  גיליון.getRange("A10:B10").merge()
    .setValue("הוספת משימה לפרויקט")
    .setFontWeight("bold")
    .setBackground("#1f4e79")
    .setFontColor("#ffffff")
    .setHorizontalAlignment("center");

  const שדות = [
    ["כותרת משימה", ""],
    ["תאריך", ""],
    ["שעת התחלה", ""],
    ["שעת סיום", ""],
    ["הערה ראשונית", ""]
  ];

  גיליון.getRange(11, 1, שדות.length, 2).setValues(שדות);
  גיליון.getRange("A11:A15").setFontWeight("bold").setBackground("#d9eaf7");
  גיליון.getRange("B15").setWrap(true);

  גיליון.getRange("A17:B17").merge()
    .setValue("לאחר מילוי הפרטים, הרץ: שמירת_משימה_מתוך_כרטיס_פרויקט")
    .setBackground("#fff2cc")
    .setHorizontalAlignment("center");

  גיליון.getRange("D10:H10").merge()
    .setValue("משימות הפרויקט")
    .setFontWeight("bold")
    .setBackground("#1f4e79")
    .setFontColor("#ffffff")
    .setHorizontalAlignment("center");

  גיליון.getRange("D11:H11")
    .setValues([["מזהה משימה", "כותרת", "תאריך", "שעה", "סטטוס"]])
    .setFontWeight("bold")
    .setBackground("#d9eaf7");

  גיליון.getRange("D12").setFormula(
    '=IFERROR(FILTER({משימות!A:A,משימות!E:E,משימות!F:F,משימות!G:G,משימות!I:I},משימות!C:C=B3),"")'
  );
}

function הוספת_אזור_משימות_לכרטיס_איש_קשר_(קובץ) {
  const גיליון = קובץ.getSheetByName("כרטיס איש קשר");

  גיליון.getRange("A13:B13").merge()
    .setValue("הוספת משימה לאיש קשר")
    .setFontWeight("bold")
    .setBackground("#1f4e79")
    .setFontColor("#ffffff")
    .setHorizontalAlignment("center");

  const שדות = [
    ["כותרת משימה", ""],
    ["תאריך", ""],
    ["שעת התחלה", ""],
    ["שעת סיום", ""],
    ["הערה ראשונית", ""]
  ];

  גיליון.getRange(14, 1, שדות.length, 2).setValues(שדות);
  גיליון.getRange("A14:A18").setFontWeight("bold").setBackground("#d9eaf7");
  גיליון.getRange("B18").setWrap(true);

  גיליון.getRange("A20:B20").merge()
    .setValue("לאחר מילוי הפרטים, הרץ: שמירת_משימה_מתוך_כרטיס_איש_קשר")
    .setBackground("#fff2cc")
    .setHorizontalAlignment("center");

  גיליון.getRange("D13:H13").merge()
    .setValue("משימות איש הקשר")
    .setFontWeight("bold")
    .setBackground("#1f4e79")
    .setFontColor("#ffffff")
    .setHorizontalAlignment("center");

  גיליון.getRange("D14:H14")
    .setValues([["מזהה משימה", "כותרת", "תאריך", "שעה", "סטטוס"]])
    .setFontWeight("bold")
    .setBackground("#d9eaf7");

  גיליון.getRange("D15").setFormula(
    '=IFERROR(FILTER({משימות!A:A,משימות!E:E,משימות!F:F,משימות!G:G,משימות!I:I},משימות!D:D=B3),"")'
  );
}

function שמירת_משימה_מתוך_כרטיס_פרויקט() {
  const קובץ = SpreadsheetApp.openById(מזהה_הגיליון);
  const כרטיס = קובץ.getSheetByName("כרטיס פרויקט");

  const מזהה_פרויקט = כרטיס.getRange("B3").getValue();
  const כותרת = כרטיס.getRange("B11").getValue();
  const תאריך = כרטיס.getRange("B12").getValue();
  const שעת_התחלה = כרטיס.getRange("B13").getValue();
  const שעת_סיום = כרטיס.getRange("B14").getValue();
  const הערה = כרטיס.getRange("B15").getValue();

  if (!מזהה_פרויקט) throw new Error("יש לבחור פרויקט בכרטיס הפרויקט");
  if (!כותרת) throw new Error("חסרה כותרת משימה");
  if (!תאריך) throw new Error("חסר תאריך משימה");

  const מזהה_משימה = יצירת_משימה_(קובץ, {
    סוג: "משימה",
    מזהה_פרויקט,
    מזהה_איש_קשר: "",
    כותרת,
    תאריך,
    שעת_התחלה,
    שעת_סיום,
    סטטוס: "פתוח"
  });

  if (הערה) יצירת_הערת_משימה_(קובץ, מזהה_משימה, הערה);

  כרטיס.getRange("B11:B15").clearContent();
  רישום_ביומן_(קובץ, "שמירת משימה מתוך כרטיס פרויקט", מזהה_משימה);
}

function שמירת_משימה_מתוך_כרטיס_איש_קשר() {
  const קובץ = SpreadsheetApp.openById(מזהה_הגיליון);
  const כרטיס = קובץ.getSheetByName("כרטיס איש קשר");

  const מזהה_איש_קשר = כרטיס.getRange("B3").getValue();
  const כותרת = כרטיס.getRange("B14").getValue();
  const תאריך = כרטיס.getRange("B15").getValue();
  const שעת_התחלה = כרטיס.getRange("B16").getValue();
  const שעת_סיום = כרטיס.getRange("B17").getValue();
  const הערה = כרטיס.getRange("B18").getValue();

  if (!מזהה_איש_קשר) throw new Error("יש לבחור איש קשר בכרטיס איש הקשר");
  if (!כותרת) throw new Error("חסרה כותרת משימה");
  if (!תאריך) throw new Error("חסר תאריך משימה");

  const מזהה_משימה = יצירת_משימה_(קובץ, {
    סוג: "משימה",
    מזהה_פרויקט: "",
    מזהה_איש_קשר,
    כותרת,
    תאריך,
    שעת_התחלה,
    שעת_סיום,
    סטטוס: "פתוח"
  });

  if (הערה) יצירת_הערת_משימה_(קובץ, מזהה_משימה, הערה);

  כרטיס.getRange("B14:B18").clearContent();
  רישום_ביומן_(קובץ, "שמירת משימה מתוך כרטיס איש קשר", מזהה_משימה);
}

function יצירת_משימה_(קובץ, נתונים) {
  const משימות = קובץ.getSheetByName("משימות");
  const עכשיו = new Date();
  const מזהה_משימה = יצירת_מזהה_("מש");

  משימות.appendRow([
    מזהה_משימה,
    נתונים.סוג || "משימה",
    נתונים.מזהה_פרויקט || "",
    נתונים.מזהה_איש_קשר || "",
    נתונים.כותרת,
    נתונים.תאריך,
    נתונים.שעת_התחלה || "",
    נתונים.שעת_סיום || "",
    נתונים.סטטוס || "פתוח",
    עכשיו,
    עכשיו,
    ""
  ]);

  return מזהה_משימה;
}

function יצירת_הערת_משימה_(קובץ, מזהה_משימה, הערה) {
  const הערות = קובץ.getSheetByName("הערות משימה");
  const עכשיו = new Date();

  הערות.appendRow([
    יצירת_מזהה_("הע"),
    מזהה_משימה,
    עכשיו,
    הערה
  ]);
}

function שדרוג_דשבורד_משימות_(קובץ) {
  const גיליון = קובץ.getSheetByName("דשבורד");

  גיליון.getRange("A25:C25").merge()
    .setValue("משימות באיחור")
    .setFontWeight("bold")
    .setBackground("#c00000")
    .setFontColor("#ffffff")
    .setHorizontalAlignment("center");

  גיליון.getRange("A26:C26")
    .setValues([["כותרת", "תאריך", "סטטוס"]])
    .setFontWeight("bold")
    .setBackground("#f4cccc");

  גיליון.getRange("A27").setFormula(
    '=IFERROR(FILTER({משימות!E:E,משימות!F:F,משימות!I:I},משימות!F:F<TODAY(),משימות!I:I<>"בוצע",משימות!A:A<>""),"")'
  );

  גיליון.getRange("E25:G25").merge()
    .setValue("משימות להיום")
    .setFontWeight("bold")
    .setBackground("#1f4e79")
    .setFontColor("#ffffff")
    .setHorizontalAlignment("center");

  גיליון.getRange("E26:G26")
    .setValues([["כותרת", "תאריך", "סטטוס"]])
    .setFontWeight("bold")
    .setBackground("#d9eaf7");

  גיליון.getRange("E27").setFormula(
    '=IFERROR(FILTER({משימות!E:E,משימות!F:F,משימות!I:I},משימות!F:F=TODAY(),משימות!I:I<>"בוצע",משימות!A:A<>""),"")'
  );

  גיליון.getRange("I25:K25").merge()
    .setValue("משימות לשבוע הקרוב")
    .setFontWeight("bold")
    .setBackground("#38761d")
    .setFontColor("#ffffff")
    .setHorizontalAlignment("center");

  גיליון.getRange("I26:K26")
    .setValues([["כותרת", "תאריך", "סטטוס"]])
    .setFontWeight("bold")
    .setBackground("#d9ead3");

  גיליון.getRange("I27").setFormula(
    '=IFERROR(FILTER({משימות!E:E,משימות!F:F,משימות!I:I},משימות!F:F>TODAY(),משימות!F:F<=TODAY()+7,משימות!I:I<>"בוצע",משימות!A:A<>""),"")'
  );
}

function שדרוג_נוחות_עבודה() {
  const קובץ = SpreadsheetApp.openById(מזהה_הגיליון);

  הגדרת_תאריכים_ושעות_(קובץ);

  רישום_ביומן_(קובץ, "שדרוג נוחות עבודה", "נוספו תאריכים, שעות ותפריט עבודה");
}

function הגדרת_תאריכים_ושעות_(קובץ) {
  const כלל_תאריך = SpreadsheetApp.newDataValidation()
    .requireDate()
    .setAllowInvalid(false)
    .build();

  const כרטיס_פרויקט = קובץ.getSheetByName("כרטיס פרויקט");
  if (כרטיס_פרויקט) {
    כרטיס_פרויקט.getRange("B12").setNumberFormat("dd/MM/yyyy").setDataValidation(כלל_תאריך);
    כרטיס_פרויקט.getRange("B13:B14").setNumberFormat("HH:mm");
  }

  const כרטיס_איש_קשר = קובץ.getSheetByName("כרטיס איש קשר");
  if (כרטיס_איש_קשר) {
    כרטיס_איש_קשר.getRange("B15").setNumberFormat("dd/MM/yyyy").setDataValidation(כלל_תאריך);
    כרטיס_איש_קשר.getRange("B16:B17").setNumberFormat("HH:mm");
  }

  const הוספת_משימה = קובץ.getSheetByName("הוספת משימה");
  if (הוספת_משימה) {
    הוספת_משימה.getRange("B7").setNumberFormat("dd/MM/yyyy").setDataValidation(כלל_תאריך);
    הוספת_משימה.getRange("B8:B9").setNumberFormat("HH:mm");
  }
}

function יצירת_תפריט_סרמ_() {
  SpreadsheetApp.getUi()
    .createMenu("CRM סרמ נדל״ן")
    .addItem("הקמת מערכת בסיסית", "הקמת_מערכת_סרמ")
    .addItem("הקמת כרטיסים", "הקמת_כרטיסים")
    .addItem("הקמת טפסי הוספה", "הקמת_טפסי_הוספה")
    .addItem("הקמת שיוך", "הקמת_טופס_שיוך")
    .addItem("הקמת משימות והערות", "הקמת_משימות_והערות")
    .addItem("הקמת דשבורד", "הקמת_דשבורד")
    .addSeparator()
    .addItem("שמור פרויקט חדש", "שמירת_פרויקט_חדש")
    .addItem("שמור איש קשר חדש", "שמירת_איש_קשר_חדש")
    .addItem("שמור שיוך חדש", "שמירת_שיוך_חדש")
    .addItem("שמור משימה מכרטיס פרויקט", "שמירת_משימה_מתוך_כרטיס_פרויקט")
    .addItem("שמור משימה מכרטיס איש קשר", "שמירת_משימה_מתוך_כרטיס_איש_קשר")
    .addItem("שמור הערת משימה", "שמירת_הערת_משימה_חדשה")
    .addSeparator()
    .addItem("רענון תאריכים ושעות", "שדרוג_נוחות_עבודה")
    .addToUi();
}

function onOpen() {
  יצירת_תפריט_סרמ_();
}

function הקמת_טופס_סימון_משימה() {
  const קובץ = SpreadsheetApp.openById(מזהה_הגיליון);

  let גיליון = קובץ.getSheetByName("סימון משימה");
  if (!גיליון) גיליון = קובץ.insertSheet("סימון משימה");

  גיליון.clear();
  גיליון.setRightToLeft(true);
  גיליון.setColumnWidths(1, 1, 220);
  גיליון.setColumnWidths(2, 1, 420);

  גיליון.getRange("A1:B1").merge()
    .setValue("עדכון סטטוס משימה")
    .setFontSize(18)
    .setFontWeight("bold")
    .setBackground("#1f4e79")
    .setFontColor("#ffffff")
    .setHorizontalAlignment("center");

  גיליון.getRange("A3:B5").setValues([
    ["מזהה משימה", ""],
    ["סטטוס חדש", ""],
    ["הערת עדכון", ""]
  ]);

  גיליון.getRange("A3:A5")
    .setFontWeight("bold")
    .setBackground("#d9eaf7");

  const משימות = קובץ.getSheetByName("משימות");

  גיליון.getRange("B3").setDataValidation(
    SpreadsheetApp.newDataValidation()
      .requireValueInRange(משימות.getRange("A2:A"), true)
      .setAllowInvalid(false)
      .build()
  );

  גיליון.getRange("B4").setDataValidation(
    SpreadsheetApp.newDataValidation()
      .requireValueInList(["פתוח", "בטיפול", "בוצע", "נדחה", "בוטל"], true)
      .setAllowInvalid(false)
      .build()
  ).setValue("בוצע");

  גיליון.getRange("B5").setWrap(true);

  גיליון.getRange("A7:B7").merge()
    .setValue("לאחר מילוי הפרטים, הרץ את הפונקציה: עדכון_סטטוס_משימה")
    .setBackground("#fff2cc")
    .setHorizontalAlignment("center");

  רישום_ביומן_(קובץ, "הקמת טופס סימון משימה", "נוצר טופס לעדכון סטטוס משימה");
}

function עדכון_סטטוס_משימה() {
  const קובץ = SpreadsheetApp.openById(מזהה_הגיליון);
  const טופס = קובץ.getSheetByName("סימון משימה");
  const משימות = קובץ.getSheetByName("משימות");

  const מזהה_משימה = טופס.getRange("B3").getValue();
  const סטטוס_חדש = טופס.getRange("B4").getValue();
  const הערה = טופס.getRange("B5").getValue();

  if (!מזהה_משימה) throw new Error("חסר מזהה משימה");
  if (!סטטוס_חדש) throw new Error("חסר סטטוס חדש");

  const נתונים = משימות.getDataRange().getValues();
  const עכשיו = new Date();
  let נמצא = false;

  for (let i = 1; i < נתונים.length; i++) {
    if (נתונים[i][0] === מזהה_משימה) {
      משימות.getRange(i + 1, 9).setValue(סטטוס_חדש);
      משימות.getRange(i + 1, 11).setValue(עכשיו);
      נמצא = true;
      break;
    }
  }

  if (!נמצא) throw new Error("מזהה המשימה לא נמצא");

  if (הערה) {
    יצירת_הערת_משימה_(קובץ, מזהה_משימה, הערה);
  }

  טופס.getRange("B3:B5").clearContent();
  טופס.getRange("B4").setValue("בוצע");

  רישום_ביומן_(קובץ, "עדכון סטטוס משימה", מזהה_משימה + " → " + סטטוס_חדש);
}
