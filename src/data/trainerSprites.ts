const T = 'https://raw.githubusercontent.com/pret/pokered/master/gfx/trainers/';
const S = 'https://raw.githubusercontent.com/pret/pokered/master/gfx/sprites/';

/** Large battle intro sprite shown on enemy side during trainer battles. */
export const TRAINER_BATTLE_SPRITES: Record<string, string> = {
  youngster:  `${T}youngster.png`,
  bugcatcher: `${T}bugcatcher.png`,
  lass:       `${T}lass.png`,
  hiker:      `${T}hiker.png`,
  brock:      `${T}brock.png`,
  misty:      `${T}misty.png`,
  rocket:     `${T}rocket.png`,
  oak:        `${T}prof.oak.png`,
  rival:      `${T}rival1.png`,
  scientist:  `${T}scientist.png`,
  surge:      `${T}ltsurge.png`,
  rocker:     `${T}rocker.png`,
  gentleman:  `${T}gentleman.png`,
  sailor:     `${T}sailor.png`,
  swimmer:    `${T}swimmer.png`,
  jr_trainer: `${T}jr.trainer_m.png`,
};

/** Small overworld sprite shown on the map. */
export const TRAINER_OVERWORLD_SPRITES: Record<string, string> = {
  youngster:  `${S}youngster.png`,
  bugcatcher: `${S}little_boy.png`,
  lass:       `${S}brunette_girl.png`,
  hiker:      `${S}hiker.png`,
  brock:      `${S}gym_guide.png`,
  rocket:     `${S}rocket.png`,
  oak:        `${S}oak.png`,
  mom:        `${S}mom.png`,
  nurse:      `${S}nurse.png`,
  rival:      `${S}blue.png`,
  daisy:      `${S}daisy.png`,
  clerk:      `${S}clerk.png`,
  citizen:    `${S}middle_aged_man.png`,
  fat_man:    `${S}balding_guy.png`,
  scientist:  `${S}scientist.png`,
};
