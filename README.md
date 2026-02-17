# World of Warships clan viewer

This is a simple tool that displays clan member statistics using the Wargaming Public API as a data source.

The application is deployed to GitHub Pages at: https://antti5.github.io/wows-clan-viewer/

## Details

For each player, the following information is shown:

* Player name *(click to jump to the profile at http://wows-numbers.com)*
* Role within clan
* Number of random battles
* Win rate
* Share of random battles played in a division
* Average tier
* Favorite ship types *(types with 10+ % share of battles are listed)*
* Clan membership time
* Inactivity time
* Account creation time

For some of the values, clan averages are also shown -- See example below.

## Application identifier

This application has no server, and instead connects to Wargaming Public API straight from 
your browser. For this connection to work **you MUST to provide an application identifier** in the
top-right corner.

As a player, you can create your own application identifier at: https://developers.wargaming.net/applications/

## Example

<img width="1170" height="1067" alt="clanviewer" src="https://github.com/user-attachments/assets/8c3cc152-8cfb-43f6-8362-3a01f41b4d97" />
