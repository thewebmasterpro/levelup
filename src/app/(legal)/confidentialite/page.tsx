export const metadata = {
  title: "Politique de confidentialité — LevelUpNow",
};

export default function ConfidentialitePage() {
  return (
    <>
      <h1>Politique de confidentialité</h1>
      <p>
        Cette politique décrit comment LevelUpNow (« nous ») traite vos données
        personnelles, conformément au Règlement général sur la protection des
        données (RGPD) et à la législation belge applicable.
      </p>

      <h2>1. Responsable du traitement</h2>
      <p>
        LevelUpNow — contact :{" "}
        <a href="mailto:contact@thewebmaster.pro" className="text-amber-400">
          contact@thewebmaster.pro
        </a>
        . <em>(À compléter avec la dénomination sociale et le n° BCE de
        l&apos;entité exploitante.)</em>
      </p>

      <h2>2. Données collectées</h2>
      <ul>
        <li>
          <strong>Données de compte</strong> : email, mot de passe (haché), nom
          complet.
        </li>
        <li>
          <strong>Données de profil</strong> (fournies volontairement) : photo,
          accroche, biographie, ville, liens, provinces, secteurs, entreprises
          (dont n° BCE).
        </li>
        <li>
          <strong>Contenus</strong> : publications, commentaires, messages,
          annonces, ressources, avis, inscriptions aux événements et
          formations.
        </li>
        <li>
          <strong>Données techniques</strong> : journaux de connexion et
          cookies strictement nécessaires à l&apos;authentification.
        </li>
      </ul>

      <h2>3. Finalités et bases légales</h2>
      <ul>
        <li>
          Fournir le service (exécution du contrat) : compte, profil,
          messagerie, notifications, mises en relation.
        </li>
        <li>
          Sécurité et modération (intérêt légitime) : validation des
          candidatures, traitement des signalements.
        </li>
        <li>
          Vérification des entreprises via les données publiques de la
          Banque-Carrefour des Entreprises (intérêt légitime).
        </li>
      </ul>

      <h2>4. Partage des données</h2>
      <p>
        Vos données de profil sont visibles des autres membres approuvés selon
        vos réglages de visibilité. Elles ne sont jamais vendues. Nos
        sous-traitants techniques : Supabase (base de données et
        authentification, hébergement UE — Irlande) et Vercel (hébergement de
        l&apos;application).
      </p>

      <h2>5. Durée de conservation</h2>
      <p>
        Vos données sont conservées tant que votre compte est actif. À la
        suppression du compte, l&apos;ensemble de vos données personnelles et
        contenus sont supprimés.
      </p>

      <h2>6. Vos droits</h2>
      <p>
        Vous disposez des droits d&apos;accès, de rectification,
        d&apos;effacement, de limitation, d&apos;opposition et de portabilité.
        Exercez-les par email à contact@thewebmaster.pro. Vous pouvez également
        introduire une réclamation auprès de l&apos;Autorité de protection des
        données (APD) : autoriteprotectiondonnees.be.
      </p>

      <h2>7. Cookies</h2>
      <p>
        L&apos;application utilise uniquement des cookies strictement
        nécessaires à l&apos;authentification (session Supabase). Aucun cookie
        publicitaire ou de pistage tiers n&apos;est déposé.
      </p>
    </>
  );
}
