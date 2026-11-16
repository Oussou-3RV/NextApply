// Symbole en image, nom écrit en HTML avec la police (jamais en image)
export default function Logo({ href }: { href?: string }) {
  const content = (
    <>
      <img src="/nextapply-symbole.svg" alt="" />
      <span className="logo-nom">Next<span>Apply</span></span>
    </>
  )
  return href ? (
    <a className="logo" href={href} aria-label="NextApply, accueil">{content}</a>
  ) : (
    <div className="logo" aria-label="NextApply">{content}</div>
  )
}
