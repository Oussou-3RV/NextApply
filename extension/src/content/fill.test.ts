import { beforeEach, describe, expect, it } from 'vitest'
import type { FillProfile } from '../shared/types'
import { fillForm } from './fill'
import { matchField, normalize } from './match'

// Formulaires simplifiés, inspirés de la façon dont chaque site nomme ses champs.
// Les vrais sites changent : quand un champ n'est pas reconnu sur un vrai formulaire,
// on ajoute ici un cas qui reproduit son HTML, puis on corrige les règles de match.ts.

const PROFILE: FillProfile = {
  firstName: 'Camille', lastName: 'Tremblay', fullName: 'Camille Tremblay',
  email: 'camille@example.com', phone: '514 555-0100', city: 'Montréal', region: 'QC',
  country: 'Canada', location: 'Montréal, QC', linkedin: 'https://linkedin.com/in/camille',
  github: 'https://github.com/camille', portfolio: 'https://camille.dev',
}

const always = () => true // jsdom ne calcule pas la mise en page : tout est « visible »

function fill(html: string) {
  document.body.innerHTML = html
  return fillForm(document, PROFILE, always)
}

const value = (selector: string) => document.querySelector<HTMLInputElement | HTMLSelectElement>(selector)!.value

beforeEach(() => {
  document.body.innerHTML = ''
})

describe('Greenhouse', () => {
  it('remplit identité, lieu et liens, mais pas l’entreprise actuelle', () => {
    fill(`
      <label for="first_name">First Name *</label><input id="first_name" name="job_application[first_name]" type="text">
      <label for="last_name">Last Name *</label><input id="last_name" name="job_application[last_name]" type="text">
      <label for="email">Email *</label><input id="email" name="job_application[email]" type="text">
      <label for="phone">Phone</label><input id="phone" name="job_application[phone]" type="text">
      <label for="loc">Location (City)</label><input id="loc" name="job_application[location]" type="text">
      <label for="q1">LinkedIn Profile</label><input id="q1" name="job_application[answers_attributes][0][text_value]">
      <label for="q2">Website</label><input id="q2" name="job_application[answers_attributes][1][text_value]">
      <label for="q3">Current Company</label><input id="q3" name="job_application[answers_attributes][2][text_value]">
      <input type="hidden" name="authenticity_token" value="jeton">`)

    expect(value('#first_name')).toBe('Camille')
    expect(value('#last_name')).toBe('Tremblay')
    expect(value('#email')).toBe('camille@example.com')
    expect(value('#phone')).toBe('514 555-0100')
    expect(value('#loc')).toBe('Montréal')
    expect(value('#q1')).toBe('https://linkedin.com/in/camille')
    expect(value('#q2')).toBe('https://camille.dev')
    expect(value('#q3')).toBe('')
    expect(value('[name=authenticity_token]')).toBe('jeton')
  })
})

describe('Lever', () => {
  it('utilise le nom complet et « Ville, région » pour la localisation', () => {
    fill(`
      <label><div>Full name</div><input type="text" name="name"></label>
      <label><div>Email</div><input type="email" name="email"></label>
      <label><div>Phone</div><input type="text" name="phone"></label>
      <label><div>Current location</div><input type="text" name="location"></label>
      <label><div>Current company</div><input type="text" name="org"></label>
      <label><div>LinkedIn URL</div><input type="text" name="urls[LinkedIn]"></label>
      <label><div>GitHub URL</div><input type="text" name="urls[GitHub]"></label>
      <label><div>Portfolio URL</div><input type="text" name="urls[Portfolio]"></label>`)

    expect(value('[name=name]')).toBe('Camille Tremblay')
    expect(value('[name=email]')).toBe('camille@example.com')
    expect(value('[name=location]')).toBe('Montréal, QC')
    expect(value('[name=org]')).toBe('')
    expect(value('[name="urls[GitHub]"]')).toBe('https://github.com/camille')
    expect(value('[name="urls[Portfolio]"]')).toBe('https://camille.dev')
  })
})

describe('Workday', () => {
  it('lit data-automation-id et laisse le poste téléphonique vide', () => {
    fill(`
      <label for="w1">First Name</label><input id="w1" data-automation-id="legalNameSection_firstName" type="text">
      <label for="w2">Last Name</label><input id="w2" data-automation-id="legalNameSection_lastName" type="text">
      <label for="w3">City</label><input id="w3" data-automation-id="addressSection_city" type="text">
      <label for="w4">Email Address</label><input id="w4" data-automation-id="email" type="text">
      <label for="w5">Phone Number</label><input id="w5" data-automation-id="phone-number" type="text">
      <label for="w6">Phone Extension</label><input id="w6" data-automation-id="phone-extension" type="text">`)

    expect(value('#w1')).toBe('Camille')
    expect(value('#w2')).toBe('Tremblay')
    expect(value('#w3')).toBe('Montréal')
    expect(value('#w4')).toBe('camille@example.com')
    expect(value('#w5')).toBe('514 555-0100')
    expect(value('#w6')).toBe('')
  })
})

describe('LinkedIn (candidature simplifiée)', () => {
  it('choisit le courriel dans la liste et ignore l’indicatif du pays', () => {
    fill(`
      <label for="l1">First name</label><input id="l1" type="text">
      <label for="l2">Last name</label><input id="l2" type="text">
      <label for="l3">Email address</label>
      <select id="l3"><option value="">Select an option</option><option>camille@example.com</option></select>
      <label for="l4">Phone country code</label>
      <select id="l4"><option>France (+33)</option><option>Canada (+1)</option></select>
      <label for="l5">Mobile phone number</label><input id="l5" type="text">`)

    expect(value('#l1')).toBe('Camille')
    expect(value('#l3')).toBe('camille@example.com')
    expect(value('#l4')).toBe('France (+33)') // inchangé
    expect(value('#l5')).toBe('514 555-0100')
  })
})

describe('Indeed', () => {
  it('suit autocomplete et remplit « City, State » avec la ville et la région', () => {
    fill(`
      <label for="i1">First name</label><input id="i1" name="firstName" autocomplete="given-name">
      <label for="i2">Last name</label><input id="i2" name="lastName" autocomplete="family-name">
      <label for="i3">Phone number</label><input id="i3" name="phoneNumber" type="tel">
      <label for="i4">City, State</label><input id="i4" name="location">`)

    expect(value('#i1')).toBe('Camille')
    expect(value('#i2')).toBe('Tremblay')
    expect(value('#i3')).toBe('514 555-0100')
    expect(value('#i4')).toBe('Montréal, QC')
  })
})

describe('Formulaire en français', () => {
  it('comprend Prénom, Nom, Courriel, Pays, et évite le nom de l’entreprise', () => {
    fill(`
      <label for="f1">Prénom</label><input id="f1">
      <label for="f2">Nom</label><input id="f2">
      <label for="f3">Courriel</label><input id="f3" type="email">
      <label for="f4">Nom de l'entreprise</label><input id="f4">
      <label for="f5">Pays</label><select id="f5"><option>France</option><option>Canada</option></select>`)

    expect(value('#f1')).toBe('Camille')
    expect(value('#f2')).toBe('Tremblay')
    expect(value('#f3')).toBe('camille@example.com')
    expect(value('#f4')).toBe('')
    expect(value('#f5')).toBe('Canada')
  })
})

describe('Règles de sécurité du remplissage', () => {
  it('ne remplace jamais une valeur déjà écrite', () => {
    const result = fill('<label for="a">First name</label><input id="a" value="Camille-Anne">')
    expect(value('#a')).toBe('Camille-Anne')
    expect(result.filled).toEqual([])
  })

  it('ignore les champs invisibles, désactivés, en lecture seule et les mots de passe', () => {
    document.body.innerHTML = `
      <label for="a">First name</label><input id="a" class="cache">
      <label for="b">Last name</label><input id="b" disabled>
      <label for="c">Email</label><input id="c" readonly>
      <label for="d">Phone password</label><input id="d" type="password">`
    const result = fillForm(document, PROFILE, (el) => !el.classList.contains('cache'))
    expect(result.filled).toEqual([])
  })

  it('n’écrit pas deux fois le même prénom, mais remplit la confirmation du courriel', () => {
    const result = fill(`
      <label for="a">First name</label><input id="a">
      <label for="b">Preferred first name</label><input id="b">
      <label for="c">Email</label><input id="c">
      <label for="d">Confirm email</label><input id="d">`)
    expect(value('#b')).toBe('')
    expect(value('#d')).toBe('camille@example.com')
    expect(result.filled).toEqual(['firstName', 'email', 'email'])
  })

  it('prévient le site par un événement input, comme une vraie saisie', () => {
    document.body.innerHTML = '<label for="a">Email</label><input id="a">'
    let events = 0
    document.querySelector('#a')!.addEventListener('input', () => events++)
    fillForm(document, PROFILE, always)
    expect(events).toBe(1)
  })
})

describe('normalize et matchField', () => {
  it('retire accents, majuscules et séparateurs', () => {
    expect(normalize('Prénom_* (obligatoire)')).toBe('prenom obligatoire')
  })

  it('ne confond pas le nom d’un contact d’urgence avec le mien', () => {
    document.body.innerHTML = '<label for="a">Emergency contact name</label><input id="a">'
    expect(matchField(document.querySelector('input')!)).toBeNull()
  })
})
