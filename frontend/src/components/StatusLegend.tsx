// Légende des statuts d'une offre (panneau bleu de la page de connexion).
// La forme dit le statut, pas seulement la couleur : point plein, cercle vide, trait.
export default function StatusLegend() {
  return (
    <ul className="legende">
      <li>
        <span className="marque marque--nouvelle" aria-hidden="true" />
        <strong>Nouvelle</strong>
        <span className="legende-texte">À examiner</span>
      </li>
      <li>
        <span className="marque marque--vue" aria-hidden="true" />
        <strong>Vue</strong>
        <span className="legende-texte">Ouverte, pas encore envoyée</span>
      </li>
      <li>
        <span className="marque marque--postulee" aria-hidden="true" />
        <strong>Postulée</strong>
        <span className="legende-texte">Envoyée, avec la date</span>
      </li>
      <li>
        <span className="marque marque--masquee" aria-hidden="true" />
        <strong className="barre">Masquée</strong>
        <span className="legende-texte">Exige plus d'expérience que toi</span>
      </li>
    </ul>
  )
}
