export const metadata = { title: "Mentions légales — LevelUpNow" };

export default function MentionsLegalesPage() {
  return (
    <>
      <h1>Mentions légales</h1>

      <h2>Éditeur</h2>
      <p>
        LevelUpNow (bêta) — plateforme communautaire pour entrepreneurs.
        Contact :{" "}
        <a href="mailto:contact@thewebmaster.pro" className="text-amber-400">
          contact@thewebmaster.pro
        </a>
        <br />
        <em>
          (À compléter avant le lancement commercial : dénomination sociale,
          forme juridique, siège social, n° BCE/TVA de l&apos;entité
          exploitante.)
        </em>
      </p>

      <h2>Hébergement</h2>
      <p>
        Application hébergée par Vercel Inc. (Walnut, Californie, USA) ;
        données hébergées par Supabase (région eu-west-1, Irlande, Union
        européenne).
      </p>

      <h2>Propriété intellectuelle</h2>
      <p>
        La marque LevelUpNow, l&apos;interface et son contenu éditorial sont la
        propriété de l&apos;éditeur. Les contenus publiés par les membres
        restent la propriété de leurs auteurs, qui concèdent à la plateforme le
        droit de les afficher aux autres membres.
      </p>

      <h2>Signalement</h2>
      <p>
        Tout contenu illicite peut être signalé directement dans
        l&apos;application (bouton « Signaler ») ou par email à
        contact@thewebmaster.pro.
      </p>
    </>
  );
}
