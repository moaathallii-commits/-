name: Generate 400+ Human Arabic Voices (Edge-TTS)

on:
  workflow_dispatch:
    inputs:
      force_regen:
        description: "إعادة توليد جميع المقاطع من جديد؟ (0 = تخطي الموجود، 1 = إعادة توليد الكل)"
        required: false
        default: "1"

permissions:
  contents: write

env:
  FORCE_JAVASCRIPT_ACTIONS_TO_NODE24: "true"

jobs:
  build-voices:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Set up Python
        uses: actions/setup-python@v5
        with:
          python-version: "3.11"

      - name: Install edge-tts
        run: |
          python -m pip install --upgrade pip
          pip install --upgrade edge-tts

      - name: Generate 400+ Human MP3 Clips & Manifest
        env:
          FORCE_REGEN: ${{ github.event.inputs.force_regen || '1' }}
        run: |
          python scripts/generate_human_voices.py

      - name: Commit and Push Generated Voices
        run: |
          git config user.name "Moaath Store Voice Bot"
          git config user.email "bot@moaath.store"
          git add sounds/ sounds_manifest.json
          if git diff --staged --quiet; then
            echo "لا توجد ملفات جديدة للرفع."
          else
            git commit -m "🎙️ توليد وتحديث مكتبة الأصوات البشرية (مقاطع MP3 + sounds_manifest.json)"
            git pull --rebase --autostash origin main || true
            git push
          fi
