#!/usr/bin/env ruby
# frozen_string_literal: true
#
# build-ios-metadata.rb — genera fastlane/metadata (iOS / App Store Connect)
# a partire da fastlane/metadata_play (export Play Store via `fastlane supply`).
#
# Mappa i codici lingua Play → ASC, copia title→name e full_description→description,
# e segnala testi fuori dai limiti iOS. Subtitle/keywords NON sono derivabili
# meccanicamente (limiti stretti) → li scriviamo a parte; questo script NON li
# tocca se già presenti.
#
# Uso:  ruby scripts/build-ios-metadata.rb
# Idempotente: sovrascrive name.txt e description.txt, preserva subtitle/keywords.

require "fileutils"

# I file di metadata sono UTF-8 (arabo, cinese, hindi, ...). Forziamo l'encoding
# così String#length conta caratteri, non byte, e niente errori US-ASCII.
Encoding.default_external = Encoding::UTF_8
Encoding.default_internal = Encoding::UTF_8

def read_utf8(path)
  File.read(path, encoding: "UTF-8")
end

ROOT     = File.expand_path("..", __dir__)
PLAY_DIR = File.join(ROOT, "fastlane", "metadata_play")
IOS_DIR  = File.join(ROOT, "fastlane", "metadata")

# Play locale → App Store Connect locale (elenco ASC ufficiale: fastlane_core ALL_LANGUAGES)
LANG_MAP = {
  "en-US" => "en-US",
  "ar"    => "ar-SA",
  "bn-BD" => "bn-BD",
  "de-DE" => "de-DE",
  "es-ES" => "es-ES",
  "fr-FR" => "fr-FR",
  "hi-IN" => "hi",
  "id"    => "id",
  "it-IT" => "it",
  "ja-JP" => "ja",
  "pt-BR" => "pt-BR",
  "ro"    => "ro",
  "ru-RU" => "ru",
  "tr-TR" => "tr",
  "ur"    => "ur-PK",
  "zh-CN" => "zh-Hans",
}.freeze

LIMIT_NAME        = 30
LIMIT_DESCRIPTION = 4000

warnings = []

LANG_MAP.each do |play_lang, asc_lang|
  play_path = File.join(PLAY_DIR, play_lang)
  ios_path  = File.join(IOS_DIR, asc_lang)
  unless Dir.exist?(play_path)
    warnings << "MISSING Play locale: #{play_lang}"
    next
  end
  FileUtils.mkdir_p(ios_path)

  title = read_utf8(File.join(play_path, "title.txt")).strip
  warnings << "#{asc_lang}: name #{title.length}>#{LIMIT_NAME} — serve fix" if title.length > LIMIT_NAME
  File.write(File.join(ios_path, "name.txt"), title + "\n")

  desc = read_utf8(File.join(play_path, "full_description.txt")).rstrip
  warnings << "#{asc_lang}: description #{desc.length}>#{LIMIT_DESCRIPTION} — accorciare" if desc.length > LIMIT_DESCRIPTION
  warnings << "#{asc_lang}: description SOLO #{desc.length} chars — Play incompleta?" if desc.length < 200
  File.write(File.join(ios_path, "description.txt"), desc + "\n")

  warnings << "#{asc_lang}: subtitle.txt DA COMPILARE (<=30)" unless File.exist?(File.join(ios_path, "subtitle.txt"))
  warnings << "#{asc_lang}: keywords.txt DA COMPILARE (<=100)" unless File.exist?(File.join(ios_path, "keywords.txt"))

  puts "OK  #{play_lang} -> #{asc_lang}  (name #{title.length}c, desc #{desc.length}c)"
end

puts "\n== Avvisi (#{warnings.size}) =="
warnings.each { |w| puts "  ! #{w}" }
puts "\nGenerato in: #{IOS_DIR}"
