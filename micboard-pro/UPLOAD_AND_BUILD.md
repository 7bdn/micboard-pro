# كيف تحصل على Setup.exe بخطوتين فقط

## الطريقة: GitHub (مجاني 100%)

### الخطوة 1 — رفع المشروع على GitHub
1. روح على https://github.com وسجل دخول (أو أنشئ حساب مجاني)
2. اضغط **New repository** — سمّه `micboard-pro` — اضغط **Create**
3. حمّل ملف `micboard-pro-source.zip` على جهازك وفك الضغط
4. داخل مجلد `micboard-pro` افتح CMD واكتب:
```
git init
git add .
git commit -m "first commit"
git branch -M main
git remote add origin https://github.com/اسمك/micboard-pro.git
git push -u origin main
```

### الخطوة 2 — انتظر 10 دقائق وحمّل الـ EXE
1. روح على صفحة الـ repo في GitHub
2. اضغط تبويب **Actions**
3. شوف الـ build يشتغل (دايرة صفراء تتحول خضراء)
4. لما يخلص اضغط عليه ← تحت **Artifacts** ← حمّل **MicBoard-Pro-Setup**
5. فك الضغط ← تلقى `MicBoard Pro Setup 1.0.0.exe` 🎉

### بعد كده — أي تعديل تعمله
فقط:
```
git add .
git commit -m "update"
git push
```
وينبني EXE جديد تلقائياً!
