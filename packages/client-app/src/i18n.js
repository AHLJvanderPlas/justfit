import { useState, useEffect } from 'react';

// ─── Language state ────────────────────────────────────────────────────────────
let _lang = localStorage.getItem('jf_lang') ?? 'nl';

export function getLang() { return _lang; }

export function setLang(lang) {
  _lang = lang;
  localStorage.setItem('jf_lang', lang);
  window.dispatchEvent(new Event('jf-lang-change'));
}

// Hook: forces re-render of any component when language changes
export function useLang() {
  const [, tick] = useState(0);
  useEffect(() => {
    const h = () => tick(n => n + 1);
    window.addEventListener('jf-lang-change', h);
    return () => window.removeEventListener('jf-lang-change', h);
  }, []);
  return _lang;
}

// ─── Translation function ──────────────────────────────────────────────────────
// English is the key. For lang='en', returns key with variable substitution only.
// For lang='nl', looks up NL dict, falls back to key.
export function t(key, vars) {
  let str;
  if (_lang === 'en') {
    str = key;
  } else {
    str = NL[key] ?? key;
  }
  if (!vars) return str;
  return str.replace(/\{(\w+)\}/g, (_, k) => (vars[k] != null ? vars[k] : `{${k}}`));
}

// ─── Dutch translation dictionary ─────────────────────────────────────────────
// Training science terms (FTP, TSS, Zone 2, PMC, CTL, ATL, TSB, RPE, VO2max) are
// intentionally NOT in this dict — they fall back to the English key in both languages.
const NL = {
  // === NAVIGATION ===
  'Today': 'Vandaag',
  'Plan': 'Plan',
  'Progress': 'Voortgang',
  'Settings': 'Instellingen',
  'Coach': 'Coach',

  // === WORKOUT VIEW — cancel / header ===
  '← Cancel': '← Annuleren',
  '← Back': '← Terug',
  '← Prev': '← Vorige',
  '{n} of {total} exercises': '{n} van {total} oefeningen',
  'Set {current}/{total}': 'Set {current}/{total}',
  'Quit workout?': 'Training stoppen?',
  "Your progress won't be saved.": 'Je voortgang wordt niet opgeslagen.',
  'Resume': 'Doorgaan',
  'Quit': 'Stoppen',
  'Tip: disable auto-lock in Phone Settings to keep your screen on.': 'Tip: zet automatisch vergrendelen uit in Telefooninstellingen om je scherm aan te houden.',

  // === WORKOUT VIEW — rest day ===
  'Time to Recover.': 'Tijd om te herstellen.',
  'Your plan calls for active recovery today.': 'Je plan heeft vandaag actief herstel.',
  'Return Home': 'Terug',

  // === WORKOUT VIEW — overview phase ===
  'exercises': 'oefeningen',
  'incl. {overhead}m overhead': 'incl. {overhead}m overhead',
  'Grab these': 'Pak dit mee',
  'Make sure this is set up': 'Zorg dat dit klaarstaat',
  'Your session': 'Jouw sessie',
  'reps': 'herhalingen',
  'set': 'set',
  'sets': 'sets',
  'Start Workout': 'Start workout',

  // === WORKOUT VIEW — instruction phase ===
  'Equipment': 'Materiaal',
  'Yoga / exercise mat (optional)': 'Yoga / fitnessmat (optioneel)',
  'Muscles targeted': 'Getrainde spieren',
  'Instructions': 'Uitleg',
  'Important note': 'Belangrijk',
  'Step {n} of {m}': 'Stap {n} van {m}',
  'Your target · {level}': 'Jouw doel · {level}',
  'Your target today': 'Jouw doel vandaag',
  'Why this helps': 'Waarom dit helpt',
  'Pace guidance': 'Tempogids',
  'Weight & rep strategy': 'Gewicht & herhaalstrategie',
  'Ready — let\u2019s go \u2192': 'Klaar \u2014 laten we gaan \u2192',

  // generic fallback instruction steps
  'Set up in the correct starting position.': 'Neem de juiste startpositie in.',
  'Focus on controlled movement — quality over speed.': 'Focus op gecontroleerde beweging \u2014 kwaliteit boven snelheid.',
  'Finish strong. You\u2019ve got this.': 'Maak het sterk af. Je kunt het.',

  // pelvic floor postnatal card
  'Remember: the release is just as important as the squeeze. Full relaxation between each rep.':
    'Onthoud: ontspannen is net zo belangrijk als aanspannen. Volledig ontspannen tussen elke herhaling.',

  // derived target texts
  'Hold at mild tension — not pain. Breathe into the stretch on each exhale.':
    'Houd bij milde spanning \u2014 geen pijn. Adem bij elke uitademing in de stretch.',
  'Keep the movement passive. Focus on releasing tension, not working through it.':
    'Houd de beweging passief. Focus op ontspanning, niet op kracht.',
  'Conversational pace throughout. Steady and sustainable beats hard and short.':
    'Gesprektempo gedurende de hele sessie. Rustig en vol te houden wint van hard en kort.',
  'Complete all sets with good form. One quality rep builds more than three sloppy ones.':
    'Voltooi alle sets met goede techniek. \u00c9\u00e9n kwaliteitsrep bouwt meer dan drie slordige.',
  'Focus on the movement, not the clock. Quality over speed.':
    'Focus op de beweging, niet de klok. Kwaliteit boven snelheid.',
  'Last 2 reps of each set should feel genuinely hard. If they don\u2019t, that\u2019s your signal to add load next session.':
    'De laatste 2 herhalingen van elke set moeten echt zwaar voelen. Zo niet, voeg meer gewicht toe volgende sessie.',
  'Control the movement, keep rest short (45\u201360s). Strength work is metabolic \u2014 treat it that way.':
    'Beheers de beweging, houd rust kort (45\u201360s). Krachtwerk is metabolisch \u2014 behandel het zo.',
  'Steady effort — you should be able to speak a sentence but feel the work. Zone 2 is where fat burns.':
    'Stabiele inspanning \u2014 je moet een zin kunnen spreken maar het werk voelen. Zone 2 is waar vet verbrand.',
  'Zone 2 — conversational pace you can sustain. This builds your aerobic engine.':
    'Zone 2 \u2014 gesprekstempo dat je vol kunt houden. Dit bouwt je aerobe motor op.',

  // derived why texts
  'Supports muscle recovery and keeps you ready for your next session.':
    'Ondersteunt spierherstel en houdt je klaar voor je volgende sessie.',
  'Maintains joint range of motion and helps prevent injury over time.':
    'Onderhoudt de beweeglijkheid van gewrichten en helpt blessures voorkomen.',
  'Trains your heart and lungs — the base that makes every other exercise feel easier.':
    'Traint je hart en longen \u2014 de basis die elke andere oefening makkelijker maakt.',
  'A strong core and stable pelvis protect your spine and improve every other movement.':
    'Een sterke kern en stabiel bekken beschermen je ruggengraat en verbeteren elke andere beweging.',
  'Bodyweight strength builds movement quality and control before adding load.':
    'Krachttraining met lichaamsgewicht bouwt bewegingskwaliteit en controle op v\u00f3\u00f3r het toevoegen van gewicht.',
  'Progressive strength training increases muscle, improves bone density, and raises your resting metabolism.':
    'Progressieve krachttraining vergroot spieren, verbetert botdichtheid en verhoogt je rustmetabolisme.',
  'Consistent movement in this pattern builds the physical capacity your goal requires.':
    'Consistente beweging in dit patroon bouwt de lichamelijke capaciteit die je doel vereist.',

  // muscle target labels
  'Pelvic Floor': 'Bekkenbodem',
  'Core & Abs': 'Kern & Buik',
  'Active Recovery': 'Actief herstel',
  'Flexibility & Joint Health': 'Flexibiliteit & Gewrichten',
  'Cardiovascular System': 'Hart & Longen',
  'Chest & Triceps': 'Borst & Triceps',
  'Back & Biceps': 'Rug & Biceps',
  'Legs & Glutes': 'Benen & Billen',
  'Shoulders': 'Schouders',
  'Core & Stability': 'Kern & Stabiliteit',
  'Full Body Strength': 'Volledige lichaamskracht',

  // === WORKOUT VIEW — working phase ===
  'Set {current} of {total}': 'Set {current} van {total}',
  'Adjusted to {n}s': 'Aangepast naar {n}s',
  'Adjusted to {n} reps': 'Aangepast naar {n} herhalingen',
  'Start': 'Start',
  '\u25a0 Done early': '\u25a0 Vroeg klaar',
  'SET COMPLETE': 'SET KLAAR',
  'COUNTED!': 'GETELD!',
  'TAP TO COUNT REP': 'TIK OM REP TE TELLEN',
  '\u2713 All {n} reps done': '\u2713 Alle {n} herhalingen gedaan',
  'Skip': 'Overslaan',
  "This doesn't feel right": 'Dit voelt niet goed',
  'Show alternatives': 'Alternatieven tonen',
  'Finish set \u2192': 'Set afronden \u2192',

  // === WORKOUT VIEW — resting phase ===
  'Set {n} of {total} complete \u2713': 'Set {n} van {total} klaar \u2713',
  'Take a breath \u2014 inhale through nose, sigh out through mouth.':
    'Adem in \u2014 inademen door de neus, uitademen door de mond.',
  'REST': 'RUST',
  'Skip rest \u2192': 'Rust overslaan \u2192',
  'Breathe \u00b7 let your heart rate settle': 'Adem \u00b7 laat je hartslag zakken',
  'Next: {name}': 'Volgende: {name}',
  'Next set: {spec} \xd7 {name}': 'Volgende set: {spec} \xd7 {name}',

  // === WORKOUT VIEW — session feedback ===
  'Session done!': 'Sessie klaar!',
  'How was the weight and effort?': 'Hoe was het gewicht en de inspanning?',
  'Rate your effort (RPE)': 'Beoordeel je inspanning (RPE)',
  'Too light': 'Te licht',
  'Just right': 'Net goed',
  'Hard': 'Zwaar',
  'Too heavy': 'Te zwaar',
  'Very easy': 'Heel makkelijk',
  'Easy': 'Makkelijk',
  'Moderate': 'Matig',
  'Maximum': 'Maximum',
  'Add weight or reps next session': 'Voeg gewicht of herhalingen toe volgende sessie',
  'Weight and reps were appropriate': 'Gewicht en herhalingen waren goed',
  'At your limit \u2014 hold or progress slowly': 'Op je limiet \u2014 houd bij of vorder langzaam',
  'Reduce weight or reps next session': 'Verminder gewicht of herhalingen volgende sessie',
  'Near your limit': 'Bijna op je limiet',
  'Max effort \u2014 could not have done more': 'Maximale inspanning \u2014 kon niet meer doen',
  'Could do much more': 'Kon veel meer doen',
  'Good effort': 'Goede inspanning',
  'Low effort \u2014 could do much more': 'Lage inspanning \u2014 kon veel meer doen',
  'Log session \u2192': 'Sessie opslaan \u2192',
  'Skip rating': 'Beoordeling overslaan',

  // === WORKOUT VIEW — alternatives sheet ===
  'Alternatives for {name}': 'Alternatieven voor {name}',
  'Same sets and reps, different movement': 'Zelfde sets en herhalingen, andere beweging',
  'Loading...': 'Laden...',
  'No alternatives found for this exercise.': 'Geen alternatieven gevonden voor deze oefening.',
  'Easier': 'Makkelijker',
  'Harder': 'Moeilijker',
  'Similar': 'Vergelijkbaar',
  'Try this instead': 'Probeer dit',

  // === HISTORY VIEW ===
  'PROGRESS': 'VOORTGANG',
  'Start your first session to begin the chart.': 'Doe je eerste sessie om de grafiek te starten.',
  'DAY': 'DAG',
  'DAYS': 'DAGEN',
  'Loading your progression\u2026': 'Voortgang laden\u2026',
  'On track': 'Op schema',
  'Building': 'Opbouwen',
  'Behind': 'Achterstand',
  'Tough week': 'Zware week',
  'Light week': 'Lichte week',
  'Well-paced': 'Goed gepaceerd',

  // trajectorySentence
  "You're moving forward \u2014 three of the last four weeks were \u22654 sessions.":
    'Je gaat vooruit \u2014 drie van de laatste vier weken waren \u22654 sessies.',
  'Slower week than usual. Worth a check-in?': 'Langzamer dan gebruikelijk. Check even in?',
  "We're rebuilding. Aim for one extra session this week.":
    'We bouwen op. Zet in op \u00e9\u00e9n sessie extra deze week.',
  'Steady. Keep showing up.': 'Stabiel. Blijf verschijnen.',

  // weekly outcome card labels
  'THIS WEEK': 'DEZE WEEK',
  'SESSIONS': 'SESSIES',
  'TRAINED': 'GETRAIND',
  'vs last week': 'vs vorige week',

  // weekly insight
  'Variety is the plan \u2014 strength, cardio and mobility in rotation.':
    'Variatie is het plan \u2014 kracht, cardio en mobiliteit afwisselend.',
  'Progressive overload accumulates. 4 sessions per week is the minimum.':
    'Progressieve overbelasting stapelt zich op. 4 sessies per week is het minimum.',
  'Volume drives hypertrophy. 4 sessions per week builds the stimulus.':
    'Volume drijft hypertrofie. 4 sessies per week bouwt de prikkel op.',
  'Consistent sessions + varied intensity keeps metabolism active.':
    'Consistente sessies + gevarieerde intensiteit houdt je metabolisme actief.',
  'Zone 2 is the engine. 5 sessions per week expands your aerobic base.':
    'Zone 2 is de motor. 5 sessies per week vergroot je aerobe basis.',
  'Regularity beats intensity. 3 sessions per week is your foundation.':
    'Regelmaat wint van intensiteit. 3 sessies per week is je fundament.',
  'Consistency is your most powerful tool.': 'Consistentie is je krachtigste instrument.',

  // session type labels
  'Strength': 'Kracht',
  'Run': 'Hardlopen',
  'Ride': 'Fietsen',
  'X-train': 'X-train',
  'Bonus': 'Bonus',
  'Session': 'Sessie',
  'Scores recomputed from your full history.': 'Scores herberekend uit je volledige geschiedenis.',
  'Recompute failed.': 'Herberekening mislukt.',

  // radar / axis breakdown
  'TRAINING BALANCE': 'TRAININGSBALANS',
  'Current': 'Huidig',
  'Goal target': 'Doelstelling',
  'Military target': 'Militair doel',
  'Goal Fit': 'Doelfit',
  'Military Fit': 'Militaire fit',
  'Program Fit': 'Programmafit',
  'Key Insights': 'Sleutelinzichten',
  'Strongest': 'Sterkste',
  'Weakest': 'Zwakste',
  'AXIS BREAKDOWN': 'ASSENANALYSE',
  'RECENT SESSIONS': 'RECENTE SESSIES',
  'No exercises recorded': 'Geen oefeningen geregistreerd',
  'Trophy room \u2192': 'Eregalerij \u2192',
  'Recomputing\u2026': 'Herberekenen\u2026',
  'Rebuild scores from history': 'Scores herberekenen',
  '\u25be Advanced': '\u25be Geavanceerd',
  '\u25b8 Advanced': '\u25b8 Geavanceerd',
  'session to go': 'sessie te gaan',
  'sessions to go': 'sessies te gaan',
  'No progression data yet': 'Nog geen voortgangsdata',
  'Complete your first workout and your training profile will appear here.':
    'Voltooi je eerste training en je profiel verschijnt hier.',

  // === PLAN WEEK VIEW ===
  'This Week': 'Deze week',
  'Your last 7 days at a glance': 'Je afgelopen 7 dagen in \u00e9\u00e9n oogopslag',
  "Today's Plan": 'Plan van vandaag',
  "Today's session": 'Sessie van vandaag',
  'Coming Up': 'Aankomend',
  'Predicting upcoming sessions\u2026': 'Komende sessies berekenen\u2026',
  'Rest day': 'Rustdag',
  'Completed Sessions': 'Afgeronde sessies',
  'Session removed': 'Sessie verwijderd',
  'Delete failed \u2014 try again': 'Verwijderen mislukt \u2014 probeer opnieuw',
  'Your workout history will appear here.': 'Je trainingsgeschiedenis verschijnt hier.',
  'Delete session?': 'Sessie verwijderen?',
  'Type DELETE': 'Typ VERWIJDER',
  'Cancel': 'Annuleren',
  'Deleting\u2026': 'Verwijderen\u2026',
  'Delete': 'Verwijderen',
  '+{n} more': '+{n} meer',
  'min': 'min',

  // day names (short)
  'Sun': 'Zo',
  'Mon': 'Ma',
  'Tue': 'Di',
  'Wed': 'Wo',
  'Thu': 'Do',
  'Fri': 'Vr',
  'Sat': 'Za',

  // month names
  'Jan': 'Jan',
  'Feb': 'Feb',
  'Mar': 'Mrt',
  'Apr': 'Apr',
  'May': 'Mei',
  'Jun': 'Jun',
  'Jul': 'Jul',
  'Aug': 'Aug',
  'Sep': 'Sep',
  'Oct': 'Okt',
  'Nov': 'Nov',
  'Dec': 'Dec',

  // === SETTINGS VIEW — landing ===
  'SETTINGS': 'INSTELLINGEN',
  'Your goal': 'Jouw doel',
  'Primary focus \u00b7 training days \u00b7 session length': 'Hoofddoel \u00b7 trainingsdagen \u00b7 sessieduur',
  'You': 'Jij',
  'Body \u00b7 equipment \u00b7 schedule \u00b7 appearance': 'Lichaam \u00b7 materiaal \u00b7 schema \u00b7 uiterlijk',
  'Coaches': 'Coaches',
  "Active programmes \u00b7 add-on coaches \u00b7 Strava": "Actieve programma\u2019s \u00b7 extra coaches \u00b7 Strava",
  'Trainers': 'Trainers',
  'Connected trainers \u00b7 data sharing \u00b7 intake': 'Verbonden trainers \u00b7 gegevensdeling \u00b7 intake',
  'Trophy room': 'Trofee\u00ebnnkamer',
  'Awards & milestones': 'Prestaties & mijlpalen',
  'Privacy': 'Privacy',
  'Data export \u00b7 legal docs \u00b7 feedback': 'Gegevensexport \u00b7 juridische documenten \u00b7 feedback',
  'Account': 'Account',
  'Email \u00b7 passkeys \u00b7 security': 'E-mail \u00b7 wachtwoordsleutels \u00b7 beveiliging',

  // sub-view titles
  'YOUR GOAL': 'JOUW DOEL',
  'YOU': 'JIJ',
  'PRIVACY': 'PRIVACY',
  'TRAINERS': 'TRAINERS',
  'ACCOUNT': 'ACCOUNT',

  // goal sub-view
  'PRIMARY FOCUS': 'HOOFDDOEL',
  'TRAINING DAYS': 'TRAININGSDAGEN',
  'SESSION LENGTH': 'SESSIEDUUR',
  'JustFit adapts your daily sessions to this. Coaches are add-ons you can activate separately.':
    'JustFit past je dagelijkse sessies hierop aan. Coaches zijn extra\u2019s die je apart kunt activeren.',
  'Lose weight & feel better': 'Afvallen en beter voelen',
  'Burn fat, build energy': 'Vet verbranden, energie opbouwen',
  'Build strength & muscle': 'Kracht en spiermassa opbouwen',
  'Get stronger week by week': 'Elke week sterker worden',
  'Improve overall fitness': 'Algehele conditie verbeteren',
  'More stamina, more capacity': 'Meer uithoudingsvermogen, meer capaciteit',
  'Boost energy & manage stress': 'Energie verhogen en stress beheersen',
  'Consistent movement, calmer mind': 'Consistent bewegen, rustiger hoofd',

  // common UI
  'Save': 'Opslaan',
  'Saving\u2026': 'Opslaan\u2026',
  'Saved': 'Opgeslagen',
  'See full page \u2192': 'Bekijk volledige pagina \u2192',
  'Summary': 'Samenvatting',
  'Effective {date}': 'Van kracht {date}',
  'Updated {date}': 'Bijgewerkt {date}',

  // appearance section
  'Appearance': 'Weergave',
  'Accent colour': 'Accentkleur',
  'saved locally on this device.': 'lokaal opgeslagen op dit apparaat.',

  // language toggle (new)
  'App language': 'Apptaal',
  'Language': 'Taal',
  'Dutch': 'Nederlands',
  'English': 'English',

  // === APP.JSX — check-in chips ===
  'Pain or soreness': 'Pijn of spierpijn',
  'Rough night': 'Slechte nacht',
  'Low energy': 'Weinig energie',
  'Zero time today': 'Geen tijd vandaag',
  'Gym access today': 'Sportschool vandaag',
  'Taking it easy': 'Rustig aan',
  'Period today': 'Ongesteld vandaag',

  // check-in smileys
  'Not great': 'Niet zo goed',
  'Okay': 'Gaat wel',
  'Good': 'Goed',

  // check-in pain areas
  'Knee': 'Knie',
  'Shoulder': 'Schouder',
  'Lower back': 'Onderrug',
  'Ankle': 'Enkel',

  // check-in step headers
  'How are you feeling?': 'Hoe voel je je?',
  'Tap to tell your coach': 'Tik om je coach te vertellen',
  "What's going on?": 'Wat speelt er?',
  'Tap anything that fits \u2014 or just hit Apply': 'Tik wat van toepassing is \u2014 of tik gewoon op Toepassen',
  'Apply': 'Toepassen',
  'Rough night? Big day? Tell me anything\u2026': 'Slechte nacht? Drukke dag? Vertel me alles\u2026',

  // activity log (DoneCard)
  'Session Complete': 'Sessie afgerond',
  'Great work. You showed up today.': 'Goed werk. Je was er vandaag.',
  'Want more?': 'Wil je meer?',
  '+ Log activity': '+ Activiteit loggen',
  'Activity type': 'Type activiteit',
  'Duration': 'Duur',
  'Walk': 'Wandelen',
  'Cycle': 'Fietsen',
  'Swim': 'Zwemmen',
  'Sport': 'Sport',
  'Other': 'Overig',

  // WhyNot options
  'No time': 'Geen tijd',
  'Feeling sick': 'Ziek',
  'Injured': 'Geblesseerd',
  'Too tired': 'Te moe',
  'No gear': 'Geen materiaal',
  'Just need rest': 'Gewoon rusten',

  // PathChoiceModal
  'Welcome to JustFit.': 'Welkom bij JustFit.',
  'We coach four kinds of athletes.': 'We begeleiden vier soorten sporters.',
  'General': 'Algemeen',
  'Running': 'Hardlopen',
  'Military': 'Militair',

  // === messagePolicy.js chip labels (deriveChipLabel output) ===
  'Clearance required': 'Vrijgave vereist',
  'High-impact removed': 'Hoge impact verwijderd',
  'Walk-run mode': 'Loop-ren modus',
  'Joint-safe mode': 'Gewrichtsveilige modus',
  'Gentle session': 'Zachte sessie',
  'Postnatal phase': 'Postnatale fase',
  'Pregnancy-adapted': 'Zwangerschapsaangepast',
  'Rest day \u2014 pain': 'Rustdag \u2014 pijn',
  'Time-adjusted': 'Tijd aangepast',
  'Bodyweight only': 'Alleen lichaamsgewicht',
  'Low-impact mode': 'Lage impact modus',
  'Mobility focus': 'Mobiliteitsfocus',
  'Low intensity': 'Lage intensiteit',
  'Volume reduced': 'Volume verminderd',
  'Recovery mode': 'Herstelmodus',
  'Return to training': 'Terugkeer training',
  'Mobility added': 'Mobiliteit toegevoegd',
  'Weakness targeted': 'Zwak punt gericht',
  'Polarised training': 'Gepolariseerd trainen',
  'Adapted for you': 'Voor jou aangepast',
  'Adapted today': 'Vandaag aangepast',

  // === messagePolicy.js SENTENCE_VARIANTS (deriveCoachSentence output) ===
  "We're easing you back in \u2014 volume capped to 75% after your break.":
    'We laten je rustig terugkomen \u2014 volume beperkt tot 75% na je pauze.',
  'Taking it easy today \u2014 mobility and recovery only.':
    'Rustig aan vandaag \u2014 alleen mobiliteit en herstel.',
  'Lighter intensity today \u2014 short sleep is worth respecting.':
    'Lichtere intensiteit vandaag \u2014 weinig slaap is het waard te respecteren.',
  'Volume reduced \u2014 your energy was low at check-in.':
    'Volume verminderd \u2014 je energie was laag bij het inchecken.',
  'Mobility session today \u2014 a high-stress day calls for something calmer.':
    'Mobiliteitssessie vandaag \u2014 een stressvolle dag vraagt om iets rustiger.',
  'Rest day \u2014 you reported pain. Recovery is part of the work.':
    'Rustdag \u2014 je meldde pijn. Herstel is onderdeel van het werk.',
  'Micro session \u2014 adapted to the time you have.':
    'Micro-sessie \u2014 aangepast aan de tijd die je hebt.',
  'Bodyweight only today \u2014 no kit needed.':
    'Alleen lichaamsgewicht vandaag \u2014 geen materiaal nodig.',
  'Quiet, low-impact session \u2014 no gym clothes required.':
    'Rustige, lage-impact sessie \u2014 geen sportkleding vereist.',
  'Gentle session today \u2014 nausea signal detected.':
    'Zachte sessie vandaag \u2014 misselijkheidssignaal gedetecteerd.',
  'Volume eased \u2014 breathlessness reported.':
    'Volume verminderd \u2014 kortademigheid gemeld.',
  'Gentle postnatal movement \u2014 rebuilding from the ground up.':
    'Zachte postnatale beweging \u2014 opnieuw opbouwen van de grond af.',
  'Pelvic floor work prioritised in today\u2019s session.':
    'Bekkenbodemoefeningen geprioriteerd in de sessie van vandaag.',
  'Intensity capped for this trimester \u2014 adapted for pregnancy.':
    'Intensiteit begrensd voor dit trimester \u2014 aangepast voor zwangerschap.',
  'High-impact exercises removed \u2014 adapted for pregnancy.':
    'Hoge-impact oefeningen verwijderd \u2014 aangepast voor zwangerschap.',
  'Joint-load exercises filtered around your reported pain areas.':
    'Gewrichtsbelastende oefeningen gefilterd rond je gerapporteerde pijngebieden.',
  'Low-impact cardio today \u2014 protecting your joints while building capacity.':
    'Lage-impact cardio vandaag \u2014 gewrichten beschermen terwijl je capaciteit opbouwt.',
  'Walk-run intervals \u2014 the safe way to build running capacity.':
    'Loop-ren intervallen \u2014 de veilige manier om hardloopcapaciteit op te bouwen.',
  'Mobility added \u2014 it\u2019s been a while since your last flexibility session.':
    'Mobiliteit toegevoegd \u2014 het is een tijdje geleden sinds je laatste flexibiliteitssessie.',
  'Weakest fitness area targeted \u2014 balanced development over time.':
    'Zwakste fitnessgebied gericht \u2014 gebalanceerde ontwikkeling over tijd.',
  'Perimenopause mode \u2014 intensity capped at moderate, session adapted for hormonal fluctuation.':
    'Perimenopauze modus \u2014 intensiteit begrensd op matig, sessie aangepast voor hormonale schommelingen.',
  'Polarised training day \u2014 alternating Zone 2 and high-intensity work.':
    'Gepolariseerde trainingsdag \u2014 afwisselend Zone 2 en hoge-intensiteitstraining.',
  'Session biased toward your primary sport.':
    'Sessie gericht op je primaire sport.',
  'Sport mobility added \u2014 one targeted exercise to support your sport.':
    'Sportmobiliteit toegevoegd \u2014 \u00e9\u00e9n gerichte oefening ter ondersteuning van je sport.',
  'Running Coach programme \u2014 structured progression, week by week.':
    'Hardloopcoach programma \u2014 gestructureerde progressie, week voor week.',
  'Safe run/walk intervals matched to your current conditioning level.':
    'Veilige loop/wandel intervallen afgestemd op je huidige conditieniveau.',

  // body-mode prefixes prepended by deriveCoachSentence
  'Adapted for pregnancy \u2014 ': 'Aangepast voor zwangerschap \u2014 ',
  'Postnatal-safe \u2014 ': 'Postnataal veilig \u2014 ',
};
