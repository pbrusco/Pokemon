const base = import.meta.env.BASE_URL;
const O = `${base}sprites/overworld/`;
const B = `${base}sprites/battle/`;

interface SpriteEntry {
  overworld: string;
  overworldFrames: number;
  /** Height of one frame in source pixels. 32 (default) = portrait 16×32. 16 = square 16×16. */
  frameH?: 16 | 32;
  battle?: string;
}

/** Maps our trainer class IDs to FireRed sprite filenames. */
export const NPC_SPRITE_MAP: Record<string, SpriteEntry> = {
  agatha:          { overworld: `${O}agatha.png`,           overworldFrames: 3,  battle: `${B}elite_four_agatha_front_pic.png` },
  blaine:          { overworld: `${O}blaine.png`,           overworldFrames: 3,  battle: `${B}leader_blaine_front_pic.png` },
  brock:           { overworld: `${O}brock.png`,            overworldFrames: 3,  battle: `${B}leader_brock_front_pic.png` },
  bruno:           { overworld: `${O}bruno.png`,            overworldFrames: 3,  battle: `${B}elite_four_bruno_front_pic.png` },
  bugcatcher:      { overworld: `${O}bug_catcher.png`,      overworldFrames: 10, battle: `${B}bug_catcher_front_pic.png` },
  chansey:         { overworld: `${O}chansey.png`,          overworldFrames: 3,  frameH: 16 },
  citizen:         { overworld: `${O}old_man_1.png`,        overworldFrames: 10 },
  clerk:           { overworld: `${O}clerk.png`,            overworldFrames: 9 },
  cooltrainer_f:   { overworld: `${O}cooltrainer_f.png`,    overworldFrames: 10, battle: `${B}cool_trainer_f_front_pic.png` },
  cooltrainer_m:   { overworld: `${O}cooltrainer_m.png`,    overworldFrames: 10, battle: `${B}cool_trainer_m_front_pic.png` },
  daisy:           { overworld: `${O}daisy.png`,            overworldFrames: 9 },
  erika:           { overworld: `${O}erika.png`,            overworldFrames: 3,  battle: `${B}leader_erika_front_pic.png` },
  fisher:          { overworld: `${O}fisher.png`,           overworldFrames: 10, battle: `${B}fisherman_front_pic.png` },
  fossil:          { overworld: `${O}fossil.png`,           overworldFrames: 1,  frameH: 16 },
  gambler:         { overworld: `${O}balding_man.png`,      overworldFrames: 10, battle: `${B}gamer_front_pic.png` },
  gentleman:       { overworld: `${O}gentleman.png`,        overworldFrames: 10, battle: `${B}gentleman_front_pic.png` },
  ghost:           { overworld: '',                         overworldFrames: 0 },
  giovanni:        { overworld: `${O}giovanni.png`,         overworldFrames: 9,  battle: `${B}leader_giovanni_front_pic.png` },
  hiker:           { overworld: `${O}hiker.png`,            overworldFrames: 10, battle: `${B}hiker_front_pic.png` },
  juggler:         { overworld: `${O}camper.png`,           overworldFrames: 10, battle: `${B}juggler_front_pic.png` },
  kangaskhan:      { overworld: `${O}kangaskhan.png`,       overworldFrames: 3,  frameH: 16 },
  koga:            { overworld: `${O}koga.png`,             overworldFrames: 3,  battle: `${B}leader_koga_front_pic.png` },
  lance:           { overworld: `${O}lance.png`,            overworldFrames: 3,  battle: `${B}elite_four_lance_front_pic.png` },
  lapras:          { overworld: `${O}lapras.png`,           overworldFrames: 3,  frameH: 16 },
  lass:            { overworld: `${O}lass.png`,             overworldFrames: 10, battle: `${B}lass_front_pic.png` },
  lorelei:         { overworld: `${O}lorelei.png`,          overworldFrames: 3,  battle: `${B}elite_four_lorelei_front_pic.png` },
  lt_surge:        { overworld: `${O}lt_surge.png`,         overworldFrames: 3,  battle: `${B}leader_lt_surge_front_pic.png` },
  machop:          { overworld: `${O}machop.png`,           overworldFrames: 3,  frameH: 16 },
  misty:           { overworld: `${O}misty.png`,            overworldFrames: 3,  battle: `${B}leader_misty_front_pic.png` },
  mom:             { overworld: `${O}mom.png`,              overworldFrames: 3 },
  nurse:           { overworld: `${O}nurse.png`,            overworldFrames: 4 },
  oak:             { overworld: `${O}prof_oak.png`,         overworldFrames: 9,  battle: `${B}professor_oak_front_pic.png` },
  old_man:         { overworld: `${O}old_man_1.png`,        overworldFrames: 10 },
  pidgeot:         { overworld: `${O}pidgeot.png`,          overworldFrames: 3,  frameH: 16 },
  poliwrath:       { overworld: `${O}poliwrath.png`,        overworldFrames: 3,  frameH: 16 },
  rival:           { overworld: `${O}blue.png`,             overworldFrames: 9,  battle: `${B}rival_early_front_pic.png` },
  champion_rival:  { overworld: `${O}blue.png`,             overworldFrames: 9,  battle: `${B}champion_rival_front_pic.png` },
  rocker:          { overworld: `${O}rocker.png`,           overworldFrames: 10, battle: `${B}rocker_front_pic.png` },
  rocket:          { overworld: `${O}rocket_m.png`,         overworldFrames: 9,  battle: `${B}rocket_grunt_m_front_pic.png` },
  sabrina:         { overworld: `${O}sabrina.png`,          overworldFrames: 3,  battle: `${B}leader_sabrina_front_pic.png` },
  sailor:          { overworld: `${O}sailor.png`,           overworldFrames: 10, battle: `${B}sailor_front_pic.png` },
  scientist:       { overworld: `${O}scientist.png`,        overworldFrames: 10, battle: `${B}scientist_front_pic.png` },
  slowbro:         { overworld: `${O}slowbro.png`,          overworldFrames: 3,  frameH: 16 },
  slowpoke:        { overworld: `${O}slowpoke.png`,         overworldFrames: 3,  frameH: 16 },
  snorlax:         { overworld: `${O}snorlax.png`,          overworldFrames: 1,  frameH: 32 },
  supernerd:       { overworld: `${O}poke_maniac.png`,      overworldFrames: 10, battle: `${B}super_nerd_front_pic.png` },
  swimmer:         { overworld: `${O}swimmer_m_land.png`,   overworldFrames: 10, battle: `${B}swimmer_m_front_pic.png` },
  voltorb:         { overworld: `${O}voltorb.png`,          overworldFrames: 3,  frameH: 16 },
  worker_f:        { overworld: `${O}worker_f.png`,         overworldFrames: 10 },
  worker_m:        { overworld: `${O}worker_m.png`,         overworldFrames: 10 },
  youngster:       { overworld: `${O}youngster.png`,        overworldFrames: 10, battle: `${B}youngster_front_pic.png` },
};

export const PLAYER_OVERWORLD_SPRITE = `${base}player.png`;
