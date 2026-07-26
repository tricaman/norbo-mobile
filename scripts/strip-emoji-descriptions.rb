#!/usr/bin/env ruby
# frozen_string_literal: true
#
# strip-emoji-descriptions.rb — rimuove le emoji dalle description.txt iOS.
# App Store Connect rifiuta le emoji nel campo description (Google Play le accetta,
# per questo erano nell'export Play). Le togliamo da tutte le 16 lingue.
#
# Rimuove i simboli emoji e ripulisce eventuali spazi iniziali lasciati sulle righe
# (es. "🐾 FOR ANY ANIMAL" -> "FOR ANY ANIMAL"). Non tocca altri file.

Encoding.default_external = Encoding::UTF_8
Encoding.default_internal = Encoding::UTF_8

ROOT    = File.expand_path("..", __dir__)
IOS_DIR = File.join(ROOT, "fastlane", "metadata")

# Range Unicode dei blocchi emoji/simboli usati nelle descrizioni.
EMOJI = /[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\u{FE0F}\u{200D}\u{23E9}-\u{23FA}\u{2300}-\u{23FF}]/

changed = 0
Dir.children(IOS_DIR).sort.each do |lang|
  path = File.join(IOS_DIR, lang, "description.txt")
  next unless File.exist?(path)

  original = File.read(path, encoding: "UTF-8")
  cleaned = original
            .gsub(EMOJI, "")                 # via le emoji
            .gsub(/^[ \t]+/, "")             # spazi a inizio riga rimasti
            .gsub(/[ \t]+$/, "")             # spazi a fine riga
            .gsub(/\n{3,}/, "\n\n")          # max una riga vuota
  cleaned = cleaned.strip + "\n"

  if cleaned != original
    File.write(path, cleaned)
    n = cleaned.strip.length
    puts "OK  #{lang}  (#{n} chars dopo pulizia)"
    changed += 1
  else
    puts "--  #{lang}  (nessuna emoji)"
  end
end
puts "\nPuliti #{changed} file."
