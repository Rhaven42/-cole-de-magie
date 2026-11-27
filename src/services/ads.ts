/**
 * Fournisseur de vidéos récompensées.
 *
 * Pour l'instant : SIMULÉ (aucune régie, aucun SDK, aucune donnée envoyée).
 * Pour brancher de vraies pubs plus tard (ex. Google AdMob via
 * `react-native-google-mobile-ads`), il faudra un compte AdMob personnel
 * (informations de paiement) : remplacer `showRewardedAd` par l'appel du SDK,
 * qui résout `true` seulement si la vidéo a été regardée jusqu'au bout.
 */
export const ADS_SIMULATED = true;

export async function showRewardedAd(): Promise<boolean> {
  // La vidéo simulée est jouée par l'écran AdModal (compte à rebours).
  return true;
}
