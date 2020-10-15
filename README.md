Ink Link Backend
===

This is the backend for [Ink Link](https://inklink.xyz) (also known as api.inklink.xyz).

What is Ink Link?
---
Ink Link is the first game from [Mouse House](https://twitter.com/mousehousedev), a team of mouse spouses making internet games.
It is a collaborative game of depiction and description.
Players take turns to describe or draw the last player's submission and at the end you can review the chains to see what comedic misinterpretations have been made along the way.

What is this repo now and what should it be in the future?
---
This is the backend half of the application. The game functions but I make no guarantees about the quality of the code (this was hacked together over lockdown). In particular I cooked up a homebrew persistence mechanism that should probably be replaced with a mature ORM or possibly just an in memory cache that offers consistency, none of the data really need be persisted.

Also I currently just push the base64 encoded images into the database, these really should be pushed to an S3 bucket or something.

It would be nice to replace the polling mechanism with websockets.

How do I deploy this?
---
It is currently deployed manually using a hand built docker container but I plan to make the construction of this automated using Github Actions. (Instructions on how to do this to come)

It relies on a Postgres database initialised with the contents of [inklink.schema](inklink.schema). Again long term I would like to replace this by either eliminating the database entirely or automating schema initialisation and upgrades.

Unless you are developing against the API you almost certainly want to deploy the Ink Link frontend somewhere so you can play the game! (Link TBD)
