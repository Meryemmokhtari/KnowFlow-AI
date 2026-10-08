# KnowFlow AI

**Assistant intelligent de gestion et de recherche des connaissances d’entreprise basé sur l’intelligence artificielle.**

KnowFlow AI est une plateforme qui permet aux utilisateurs de centraliser leurs documents, de rechercher des informations pertinentes et d’obtenir des réponses générées par l’intelligence artificielle à partir des connaissances disponibles.

## Objectifs du projet

* Faciliter l’accès aux connaissances contenues dans les documents.
* Améliorer la recherche d’informations grâce à la recherche sémantique.
* Générer des réponses contextualisées à l’aide d’un système RAG.
* Sécuriser l’accès aux fonctionnalités selon les rôles des utilisateurs.
* Proposer une architecture modulaire basée sur des microservices.

## Fonctionnalités principales

* Gestion et consultation des documents.
* Recherche sémantique dans les documents.
* Questions-réponses assistées par l’intelligence artificielle.
* Génération de résumés de documents.
* Authentification avec JWT.
* Gestion des rôles et des autorisations (RBAC).
* Journalisation des activités et gestion des notifications.
* Interface web développée avec React.

## Architecture technique

| Composant                 | Technologies                       |
| ------------------------- | ---------------------------------- |
| Frontend                  | React, Vite, JavaScript, HTML, CSS |
| Backend                   | C#, ASP.NET Core, .NET 9           |
| Architecture              | Microservices, API                 |
| Intelligence artificielle | Ollama, LLM                        |
| Recherche sémantique      | Embeddings, RAG                    |
| Base vectorielle          | Qdrant                             |
| Sécurité                  | JWT, BCrypt, RBAC                  |
| Conteneurisation          | Docker                             |

## Architecture des services

Le backend est organisé en plusieurs services indépendants :

* **AuthService** : authentification et gestion des accès.
* **UserService** : gestion des utilisateurs.
* **DocumentService** : gestion des documents.
* **SearchService** : recherche sémantique.
* **AIService** : traitement des requêtes IA et génération des réponses.
* **ApiGateway** : point d’entrée des API.
* **KnowFlow.Common / KnowFlow.Shared** : composants partagés.

## Principe du système RAG

Le système Retrieval-Augmented Generation (RAG) suit les étapes suivantes :

1. Importation d’un document.
2. Extraction et préparation du contenu.
3. Génération des embeddings.
4. Stockage des représentations vectorielles dans Qdrant.
5. Recherche des passages pertinents selon la question.
6. Génération d’une réponse contextualisée par le modèle d’IA.

## Technologies et outils

* React et Vite
* C# et ASP.NET Core (.NET 9)
* Ollama
* Qdrant
* Docker
* Git et GitHub
* JSON Web Token (JWT)

## État du projet

Projet en cours de développement et d’amélioration dans le cadre de mon parcours en Génie Informatique, avec un intérêt particulier pour le développement Full-Stack, les architectures microservices et l’intelligence artificielle appliquée aux applications métier.

## Auteur

**Meryem Mokhtari**
Étudiante en 5ème année Génie Informatique — Option Développement Informatique

GitHub : [Meryemmokhtari](https://github.com/Meryemmokhtari)

---

*KnowFlow AI — Transformez vos documents en connaissances accessibles.*
