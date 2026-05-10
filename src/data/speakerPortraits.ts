const B = `${import.meta.env.BASE_URL}sprites/battle/`;

const SPEAKER_PORTRAITS: Record<string, string> = {
  'PROF. OAK': `${B}professor_oak_front_pic.png`,
  'OAK': `${B}professor_oak_front_pic.png`,
  'AZUL': `${B}rival_early_front_pic.png`,
  'LORELEI': `${B}elite_four_lorelei_front_pic.png`,
  'BRUNO': `${B}elite_four_bruno_front_pic.png`,
  'AGATHA': `${B}elite_four_agatha_front_pic.png`,
  'LANCE': `${B}elite_four_lance_front_pic.png`,
  'BROCK': `${B}leader_brock_front_pic.png`,
  'MISTY': `${B}leader_misty_front_pic.png`,
  'TENIENTE SURGE': `${B}leader_lt_surge_front_pic.png`,
  'ERIKA': `${B}leader_erika_front_pic.png`,
  'KOGA': `${B}leader_koga_front_pic.png`,
  'SABRINA': `${B}leader_sabrina_front_pic.png`,
  'BLAINE': `${B}leader_blaine_front_pic.png`,
  'GIOVANNI': `${B}leader_giovanni_front_pic.png`,
};

export function getSpeakerPortrait(speaker: string): string | undefined {
  return SPEAKER_PORTRAITS[speaker];
}
