/* eslint max-len: 0 */
export const Config = {
  APP_NAME: 'Zenika Resume',
  THEMES: [
    {
      name: 'default',
      author: 'Rory Willians',
      email: '',
    },
    {
      name: 'light',
      author: 'Aurelien Loyer',
      email: 'aurelien.loyer@zenika.com',
    },
  ],
  DEFAULT_METADATA: {
    name: 'Last-Name',
    firstname: 'First-Name',
    email: 'first-name.last-name@zenika.com',
    agency: 'Your agency here (Lille, Lyon, Rennes, ...)',
    lang: 'fr',
    experience: 'N ans d\'expérience',
    description: `Your headline here`,
    column1: `[Use this column to highlight skills, external profiles etc. This following is an example.]::
* Portfolio : bbc.in/1OCrHKk
* Exemples de code : codepen.io/phenax/pen/WQXerz`,
    column2: `[Use this column to highlight skills, external profiles etc. This following is an example.]::
# **Formateur**
* Angular JS
* Angular 2
* Ecplise RCP`,
    column3: `[Use this column to highlight skills, external profiles etc. This following is an example.]::
# **Conférencier**
* Devoxx
* Mix IT`,
    theme: 'light'
  },
  DEFAULT_CONTENT: [
    `
# Expérience

[Use one section per experience item. A section MUST not span more that one page.]::
[You are responsible for page breaks. Use --break-page between sections insert visually nice page breaks. Check the page layout by using the print function of the browser (remove margins).]::

--section-start

[This is a placeholder section. See the next section for a more real life example.]::

# Job title
## Company
### Time period

* Bullet point 1
  * Sub-bullet point 1
  * Sub-bullet point 2

* Bullet point 2
  * Sub-bullet point 1
  * Sub-bullet point 2

--section-end

--break-page

--section-start

# Consultant
## BNP Paribas CIB- Equipe Feeds&Recs
### Mai 2016 - Juin 2016

* Projet Feeds, application gérant
  * Les Alimentations inter-applicatives Middle Office/Back Office
  * Les descentes des flux financiers du Front vers le Back (Murex/ Ubix / Calypso…)
  * Les Réconciliations Clearers/Front Office et Middle Office/Back Office : Paramétrage/ Reporting des réconciliations via Intellimatch (SUNGARD) et Business Object
  * (Équipe de 7 personnes)

* Mission et tâches principales :
  * La maintenance et l’amélioration des EAI/ESB qui régissent les flux de données afin d’intégrer un ensemble d’applications hétérogènes
  * Amélioration des outils de test existants
  * Proposer, concevoir et développer de nouveaux outils de tests
  * Conception et développement des outils de reportings
  * Analyse, conception et réalisation d’un PoC pour un nouvel EAI

* **Environnement technique : JAVA 8/6, JEE, Spring 3/4 (Core, Boot, Batch), Maven (2/3), Jrules,Tibco BW (5.7), JUnit, Weblogic 9/11/12, XML, XSD, oracle 10g, CDI, Lombok, GIT, SVN, Jenkins,EJB 3.2**

--section-end

--break-page

# Loisirs
*
  * Musique
  * Photographie

# Langues
*
  * Français
  * Anglais
  
`
  ].join('\n')
};
