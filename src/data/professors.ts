/**
 * Professeur·es nommé·es par la directrice du projet.
 * Le recrutement complet (candidats, salaires, qualités/défauts) arrive au J5 ;
 * ces noms seront repris comme professeur·es titulaires.
 * `null` = nom en attente.
 */
import type { CourseId } from './courses';

export interface ProfessorName {
  firstName: string | null;
  lastName: string | null;
  /** Titre ou surnom. */
  title?: string;
  gender?: 'f' | 'm';
  /** Trait de caractère (titre court). */
  trait?: string;
  /** Portrait moral (texte de l’autrice). */
  bio?: string;
}

export const NAMED_PROFESSORS: Partial<Record<CourseId, ProfessorName>> = {
  defense: {
    firstName: 'Harvald',
    lastName: 'Brennoch',
    gender: 'm',
    trait: 'Le savoir-faire sans le discours',
    bio: 'Harvald n’est pas froid : il préfère montrer un geste plutôt que l’expliquer trois fois. Il repère le détail qui cloche, le corrige, puis rend aussitôt la main à l’élève. On sait qu’il vous fait confiance le jour où il vous tend son meilleur outil sans vous rappeler comment vous en servir. Son défaut, c’est qu’à force de trouver certains gestes évidents, il oublie parfois à quel point ils sont difficiles quand on débute.',
  },
  charms: {
    firstName: 'Taladon',
    lastName: 'Morvard',
    gender: 'm',
    trait: 'La bonté sans naïveté',
    bio: 'Taladon est de ces vieux hommes qui se souviennent du prénom d’un élève longtemps après avoir oublié où ils ont posé leurs lunettes. Il laisse les gens finir leurs phrases, même quand ils cherchent leurs mots, et préfère une conversation au coin du feu à une réprimande devant toute la classe. Avec Rhaven, sa fille adoptive, cette indulgence lui joue parfois des tours : il voit si bien les raisons de ses écarts qu’il tarde à lui en faire assumer les conséquences.',
  },
  transfiguration: {
    firstName: 'Tenarius',
    lastName: 'D’Arvay',
    gender: 'm',
    trait: 'La rigueur au service de la justice',
    bio: 'Tenarius annonce ses règles avant de les faire appliquer et ne change pas le barème parce qu’un élève lui plaît. Une erreur avouée ne lui inspire pas la même sévérité qu’une faute rejetée sur un camarade. Ses compliments sont rares et précis : « Ton geste était juste, cette fois. » Rhaven l’exaspère moins quand elle enfreint une règle que quand elle le fait sans avoir réfléchi à ce qu’elle risquait d’entraîner pour les autres.',
  },
  potions: {
    firstName: 'Dolohov',
    lastName: 'Sarneth',
    gender: 'm',
    trait: 'Le mot qui fait mouche',
    bio: 'Dolohov a un humour sombre et un goût marqué pour les réponses qui laissent un silence derrière elles. Plus on essaie de l’impressionner, plus il devient mordant ; il est froid et calculateur.',
  },
  botany: {
    firstName: 'Solomon',
    lastName: 'Tregahl',
    gender: 'm',
    trait: 'L’exigence et ses exceptions',
    bio: 'Solomon ne laisse rien passer : pas un pot mal étiqueté, pas une consigne suivie à moitié. Il préfère interrompre un exercice plutôt que laisser un élève réussir par chance. Pourtant, devant certaines plantes interdites, toute sa sévérité cède la place à une fascination presque enfantine : il supporte mal qu’on les dise simplement « nuisibles ». Il distingue très bien la curiosité de l’imprudence chez ses élèves ; chez lui, la frontière est moins nette.',
  },
  astronomy: {
    firstName: 'Alva Ilan',
    lastName: 'Arsolle',
    gender: 'f',
    trait: 'La douceur qui sait dire non',
    bio: 'Alva remarque l’élève qui rit avant les autres pour faire croire qu’une remarque ne l’a pas blessé. Elle attend d’être seule avec lui pour lui en parler. Elle rassure sans promettre que tout ira bien et sait rester ferme sans humilier. Quand deux élèves se disputent, elle écoute les deux versions, mais elle ne demande jamais à celui qui a été blessé de pardonner juste pour que la classe retrouve son calme.',
  },
  divination: {
    firstName: 'Rhaven',
    lastName: 'Morvard',
    gender: 'f',
    trait: 'La provocation comme épreuve',
    bio: 'Rhaven teste les règles comme elle teste les gens : elle veut voir qui tient bon, qui se vexe et qui est capable de lui répondre autrement que par « parce que c’est comme ça ». Fille adoptive de Taladon et apprentie de Tenarius, elle déteste qu’on attribue ses réussites à l’un ou qu’on demande à l’autre de réparer ses bêtises. Elle tient à leur estime plus qu’elle ne veut l’avouer. C’est souvent quand Tenarius lui confie une vraie responsabilité qu’elle se montre la plus sérieuse — quitte à faire semblant de s’ennuyer.',
  },
  history: {
    firstName: 'Morgenvar',
    lastName: 'Kaldrec',
    gender: 'm',
    trait: 'Le silence et les vérités sèches',
    bio: 'Morgenvar ne fait pas de mystère pour attirer l’attention : il considère simplement que tout le monde n’a pas besoin de tout savoir. Il écoute longtemps, puis pose la question que les autres évitaient. Il ne cherche pas la formule brillante comme Dolohov ; il dit ce qu’il pense, parfois trop crûment, et passe à autre chose. Sa manière de témoigner son affection est du même ordre : il vient aider sans qu’on le lui demande et ne revient jamais sur le service rendu.',
  },
  duel: {
    firstName: 'Delan',
    lastName: 'Lanatre',
    gender: 'm',
    trait: 'Le plaisir de trouver plus fort que soi',
    bio: 'Delan est un duelliste jusque dans sa façon de discuter : une objection bien placée lui plaît davantage qu’un accord facile. Il préfère perdre contre quelqu’un qui l’a surpris que gagner un duel joué d’avance. Avec les élèves, il admire autant le sang-froid que l’audace et prend plaisir à voir quelqu’un retourner contre lui une feinte qu’il lui a enseignée. Son défaut, c’est qu’il sait accepter une défaite avec élégance… mais qu’il a beaucoup de mal à ne pas demander la revanche.',
  },
  flying: {
    firstName: 'Harwen',
    lastName: 'Malkin',
    gender: 'f',
    trait: 'L’audace communicative',
    bio: 'Harwen a le rire facile quand un exercice dérape et le don de transformer un « je n’y arriverai jamais » en « d’accord, encore une fois ». Elle n’a peur de rien, ce qui la rend aussi entraînante qu’épuisante. Elle préfère voir un élève inventer sa propre solution plutôt que reproduire la sienne à la perfection. Son angle mort : à force de prendre la peur pour un obstacle à franchir, elle ne voit pas toujours quand un élève a surtout besoin de souffler.',
  },
};

export function professorLabel(p: ProfessorName): string {
  const name = [p.firstName, p.lastName].filter(Boolean).join(' ') || 'Nom à venir';
  return p.title ? `${name}, ${p.title}` : name;
}

export function professorTitle(p: ProfessorName): string {
  return p.gender === 'f' ? 'Professeure' : 'Professeur';
}
