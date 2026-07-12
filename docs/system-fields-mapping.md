# System Fields Mapping Report

Scope: safe first phase for Project, Contact, and Task existing fields only. The settings sheet is `הגדרות_שדות`; if a matching active setting is absent or invalid, the UI keeps the hard-coded behavior listed here.

| Entity | Field | Current hard-coded UI location | Matching System Field setting | Safe settings-driven now? | Behavior remaining hard-coded |
|---|---|---|---|---|---|
| Project | שם פרויקט | list title column, card title, edit form | פרויקט / שם פרויקט | Partially: searchable, card/list order; title remains always visible | Always visible title/name, server required rule, row click target |
| Project | עיר | list, card, edit form | פרויקט / עיר | Yes | Selection options still from linked category/options |
| Project | תחום | list, card, edit form | פרויקט / תחום | Yes | Selection options still from linked category/options |
| Project | סטטוס | list, card, edit form | פרויקט / סטטוס | Yes | Selection options still from linked category/options |
| Project | אחראי | card, edit form, search | פרויקט / אחראי | Yes for card/search/required marker | User picker source remains hard-coded |
| Project | תגיות | edit form, search | פרויקט / תגיות | Yes for search/required marker | No dynamic custom storage |
| Project | תיקיית Drive | edit form | פרויקט / תיקיית Drive | Required marker only | Drive semantics remain hard-coded |
| Contact | שם מלא | list title column, card title, edit form | איש קשר / שם מלא | Partially: searchable, card/list order; title remains always visible | Always visible title/name, server required rule, row click target |
| Contact | טלפון | list, card, edit form | איש קשר / טלפון | Yes | None |
| Contact | אימייל | list, card, edit form | איש קשר / אימייל | Yes | None |
| Contact | כתובת | edit form | איש קשר / כתובת | Yes for search/required marker | None |
| Contact | מקור הגעה | edit form | איש קשר / מקור הגעה | Required marker only | Selection options still from linked category/options |
| Contact | סוג איש קשר | list, card, edit form | איש קשר / סוג איש קשר | Yes | Selection options still from linked category/options |
| Contact | סטטוס לקוח | list, card, edit form | איש קשר / סטטוס לקוח | Yes | Selection options still from linked category/options |
| Contact | תגיות | edit form, search | איש קשר / תגיות | Yes for search/required marker | None |
| Contact | מנהל | conditional permission form field | איש קשר / מנהל | Required marker only | Permission-dependent visibility remains hard-coded |
| Contact | אחראי | conditional permission form field, search | איש קשר / אחראי | Yes for search/required marker | Permission-dependent visibility remains hard-coded |
| Contact | הרשאת מערכת | list, card, edit form | איש קשר / הרשאת מערכת | Yes for list/card/search/required marker | Permission behavior and allowed roles remain hard-coded |
| Contact | גוון יוצר | conditional permission form field | איש קשר / גוון יוצר | No | Calendar creator color behavior remains hard-coded |
| Task | כותרת | list title column, card title, edit form | משימה / כותרת | Partially: searchable, card/list order; title remains always visible | Always visible title/name, server required rule, row click target |
| Task | סוג משימה | list, card, edit form | משימה / סוג משימה | Yes | Meeting-specific behavior remains hard-coded |
| Task | עדיפות | list, card, edit form | משימה / עדיפות | Yes | Priority styling remains hard-coded |
| Task | תאריך | list, card, edit form, filters/calendar | משימה / תאריך | Yes for list/card/search/required marker | Calendar/filter/date semantics remain hard-coded |
| Task | שעה | list, card, edit form | משימה / שעה | Yes | Meeting/time logic remains hard-coded |
| Task | שעת סיום | card, conditional edit form | משימה / שעת סיום | Yes for card/required marker | Meeting end-time rules remain hard-coded |
| Task | משך פגישה | card, conditional edit form | משימה / משך פגישה | Yes for card/required marker | Duration/end-time calculation remains hard-coded |
| Task | מיקום | card, conditional edit form | משימה / מיקום | Yes for card/required marker | Meeting-only visibility remains hard-coded |
| Task | כניסה ליומן | card, conditional edit form | משימה / כניסה ליומן | Yes for card/required marker | Calendar invite behavior remains hard-coded |
| Task | משתתפים ביומן | conditional edit form | משימה / משתתפים ביומן | No | Guest resolution and invite behavior remain hard-coded |
| Task | מזהה פרויקט / משויך לפרויקט | list display, card relation name, edit form | משימה / מזהה פרויקט or משימה / משויך לפרויקט | Yes for list/card/search/required marker | Project relation and filter remain hard-coded |
| Task | מזהה איש קשר / איש קשר | card relation name, edit form | משימה / מזהה איש קשר or משימה / איש קשר | Yes for card/search/required marker | Contact relation remains hard-coded |
| Task | אחראי | card, edit form, search | משימה / אחראי | Yes | User picker source remains hard-coded |
| Task | סטטוס | list, card, edit form, filters | משימה / סטטוס | Yes for list/card/search/required marker | Status filters/actions remain hard-coded |
| Task | הערות למשימה | card, edit form, search | משימה / הערות למשימה | Yes for card/search/required marker | Notes/timeline remain hard-coded |
