#!/usr/bin/env ruby
# frozen_string_literal: true
#
# write-ios-subtitle-keywords.rb — scrive subtitle.txt (<=30) e keywords.txt (<=100)
# per ogni lingua ASC in fastlane/metadata/<asc_lang>/.
#
# Subtitle: traduce il concetto EN "Reminders, health & expenses".
# Keywords: termini di ricerca localizzati (csv, senza spazi dopo la virgola per
# massimizzare i 100 char). Niente parole già nel `name` (Apple le indicizza a parte).
#
# Uso:  ruby scripts/write-ios-subtitle-keywords.rb
# Verifica i limiti e ABORTA se un testo sfora, senza scrivere quel file.

Encoding.default_external = Encoding::UTF_8
Encoding.default_internal = Encoding::UTF_8

ROOT    = File.expand_path("..", __dir__)
IOS_DIR = File.join(ROOT, "fastlane", "metadata")

# asc_lang => { subtitle:, keywords: }
DATA = {
  "en-US"   => { subtitle: "Reminders, health & expenses",
                 keywords: "pet,dog,cat,reminder,vet,vaccine,health,weight,expenses,animal,care,reptile,bird,fish" },
  "it"      => { subtitle: "Promemoria, salute e spese",
                 keywords: "animale,cane,gatto,promemoria,veterinario,vaccino,salute,peso,spese,cura,rettile,pesci" },
  "ar-SA"   => { subtitle: "تذكيرات وصحة ونفقات",
                 keywords: "حيوان,كلب,قطة,تذكير,بيطري,لقاح,صحة,وزن,نفقات,رعاية,زواحف,طيور,أسماك" },
  "bn-BD"   => { subtitle: "রিমাইন্ডার, স্বাস্থ্য ও খরচ",
                 keywords: "পোষা,কুকুর,বিড়াল,রিমাইন্ডার,ভেট,টিকা,স্বাস্থ্য,ওজন,খরচ,যত্ন,পাখি,মাছ" },
  "de-DE"   => { subtitle: "Erinnerungen, Gesundheit",
                 keywords: "haustier,hund,katze,erinnerung,tierarzt,impfung,gesundheit,gewicht,kosten,reptil,vogel" },
  "es-ES"   => { subtitle: "Recordatorios, salud y gastos",
                 keywords: "mascota,perro,gato,recordatorio,veterinario,vacuna,salud,peso,gastos,reptil,ave,peces" },
  "fr-FR"   => { subtitle: "Rappels, santé et dépenses",
                 keywords: "animal,chien,chat,rappel,vétérinaire,vaccin,santé,poids,dépenses,reptile,oiseau,poisson" },
  "hi"      => { subtitle: "रिमाइंडर, स्वास्थ्य और खर्च",
                 keywords: "पालतू,कुत्ता,बिल्ली,रिमाइंडर,पशु,टीका,स्वास्थ्य,वजन,खर्च,देखभाल,पक्षी,मछली" },
  "id"      => { subtitle: "Pengingat, kesehatan, biaya",
                 keywords: "hewan,anjing,kucing,pengingat,dokter,vaksin,kesehatan,berat,biaya,reptil,burung,ikan" },
  "ja"      => { subtitle: "リマインダー・健康・費用",
                 keywords: "ペット,犬,猫,リマインダー,獣医,ワクチン,健康,体重,費用,爬虫類,鳥,魚,飼育" },
  "pt-BR"   => { subtitle: "Lembretes, saúde e gastos",
                 keywords: "pet,cão,gato,lembrete,veterinário,vacina,saúde,peso,gastos,réptil,ave,peixe" },
  "ro"      => { subtitle: "Memento-uri, sănătate, costuri",
                 keywords: "animal,câine,pisică,memento,veterinar,vaccin,sănătate,greutate,cheltuieli,reptilă,pești" },
  "ru"      => { subtitle: "Напоминания, здоровье, расходы",
                 keywords: "питомец,собака,кошка,напоминание,ветеринар,прививка,здоровье,вес,расходы,рептилия,птица" },
  "tr"      => { subtitle: "Hatırlatıcı, sağlık, gider",
                 keywords: "evcil,köpek,kedi,hatırlatıcı,veteriner,aşı,sağlık,kilo,gider,bakım,sürüngen,kuş,balık" },
  "ur-PK"   => { subtitle: "یاد دہانی، صحت اور اخراجات",
                 keywords: "پالتو,کتا,بلی,یاد دہانی,ویٹ,ویکسین,صحت,وزن,اخراجات,دیکھ بھال,پرندہ,مچھلی" },
  "zh-Hans" => { subtitle: "提醒、健康与花费",
                 keywords: "宠物,狗,猫,提醒,兽医,疫苗,健康,体重,花费,护理,爬行动物,鸟,鱼,饲养" },
}.freeze

SUB_LIMIT = 30
KW_LIMIT  = 100
errors = []

DATA.each do |lang, v|
  dir = File.join(IOS_DIR, lang)
  unless Dir.exist?(dir)
    errors << "#{lang}: cartella mancante (#{dir})"
    next
  end

  sub = v[:subtitle].strip
  kw  = v[:keywords].strip

  if sub.length > SUB_LIMIT
    errors << "#{lang}: subtitle #{sub.length}>#{SUB_LIMIT} — «#{sub}»"
  else
    File.write(File.join(dir, "subtitle.txt"), sub + "\n")
  end

  if kw.length > KW_LIMIT
    errors << "#{lang}: keywords #{kw.length}>#{KW_LIMIT} — «#{kw}»"
  else
    File.write(File.join(dir, "keywords.txt"), kw + "\n")
  end

  puts "#{lang}: subtitle #{sub.length}c, keywords #{kw.length}c"
end

if errors.any?
  puts "\n== ERRORI (#{errors.size}) — file NON scritti dove sfora =="
  errors.each { |e| puts "  ✗ #{e}" }
  exit 1
else
  puts "\nTutti entro i limiti (subtitle<=#{SUB_LIMIT}, keywords<=#{KW_LIMIT})."
end
