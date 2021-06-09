// PROVIDED CODE BELOW (LINES 1 - 80) DO NOT REMOVE

// The store will hold all information needed globally
const store = {
	track_id: undefined,
	player_id: undefined,
	race_id: undefined,
}

// The appVars stores all of the application constant variables  
const appVars = {
	SERVER: 'http://localhost:8000'

}

// We need our javascript to wait until the DOM is loaded
document.addEventListener("DOMContentLoaded", function () {
	onPageLoad();
	setupClickHandlers();
})

async function onPageLoad() {
	try {
		getTracks()
			.then(tracks => {
				const html = renderTrackCards(tracks)
				renderAt('#tracks', html)
			})

		getRacers()
			.then((racers) => {
				const html = renderRacerCars(racers)
				renderAt('#racers', html)
			})
	} catch (error) {
		console.log("Problem getting tracks and racers ::", error.message);
		console.error(error);
	}
}

function setupClickHandlers() {
	document.addEventListener('click', function (event) {
		const { target } = event;

		// Race track form field
		if (target.matches('.card.track')) {
			handleSelectTrack(target);
		} else if (target.parentElement.matches('.card.track')) {
			handleSelectTrack(target.parentElement);
		}

		// Podracer form field
		if (target.matches('.card.podracer')) {
			handleSelectPodRacer(target);
		} else if (target.parentElement.matches('.card.podracer')) {
			handleSelectPodRacer(target.parentElement);
		}

		// Submit create race form
		if (target.matches('#submit-create-race')) {
			event.preventDefault();

			// start race
			handleCreateRace();
		}

		// Handle acceleration click
		if (target.matches('#gas-peddle')) {
			handleAccelerate(store.race_id);
		}

	}, false)
}

async function delay(ms) {
	try {
		return await new Promise(resolve => setTimeout(resolve, ms));
	} catch (error) {
		console.log("an error shouldn't be possible here");
		console.log(error);
	}
}

// This async function controls the flow of the race, add the logic and error handling
async function handleCreateRace() {
	try {
		// Get the name of the currently selected track
		const selectedTrackName = document.querySelector('.card.track.selected').innerText;
		// Get player_id and track_id from the store
		const { player_id, track_id } = store;

		// render starting UI
		renderAt('#race', renderRaceStartView(selectedTrackName));

		// Invoke the API call to create the race, then save the result
		const race = await createRace(player_id, track_id);

		// Update the store with the race id
		store.race_id = race.ID - 1;

		// The race has been created, now start the countdown
		// Call the async function runCountdown
		await runCountdown(3);

		// Call the async function startRace
		await startRace(store.race_id);

		// Call the async function runRace
		await runRace(store.race_id);
	}
	catch (error) {
		console.log('Error creating new race ::', error.message);
		console.error(error);
	}
}

function runRace(raceID) {
	return new Promise((resolve, reject) => {

		function sortLeaderBoard(raceID) {
			// Get race information
			getRace(raceID)
				.then((res) => {
					// Update the leaderboard for on going race
					if (res.status === 'in-progress') {
						renderAt('#leaderBoard', raceProgress(res.positions));
					}
					// Render final results for finished race 
					else if (res.status === 'finished') {
						clearInterval(raceInterval); // Stop the interval from repeating
						renderAt('#race', resultsView(res.positions)); // to render the results view
						reslove(res);// resolve the promise	
					}
					else {
						reject('Error:: Race status is not correct');
					}
				})
				.catch(err => console.log('Error in sorting the leader board::', err));
		}

		// Use setInterval to sort the leaderBoard every 500ms
		const raceInterval = setInterval(sortLeaderBoard, 500, raceID);
	})
}


async function runCountdown(count) {
	try {
		// wait for the DOM to load
		// await delay(1000);
		let timer = count;

		return new Promise(resolve => {
			function countDown() {
				// run this DOM manipulation to decrement the countdown for the user
				document.getElementById('big-numbers').innerHTML = --timer;

				// if the countdown is done, clear the interval, resolve the promise, and return
				if (timer <= 1) {
					clearInterval(timerInterval);
					resolve();
				}
			}
			// TODO - use Javascript's built in setInterval method to count down once per second
			const timerInterval = setInterval(countDown, 1000);
		})
	} catch (error) {
		console.log(error);
	}
}

function handleSelectPodRacer(target) {
	try {
		console.log("selected a pod", target.id);

		// remove class selected from all racer options
		const selected = document.querySelector('#racers .selected');
		if (selected) {
			if (selected == target) return;
			selected.classList.remove('selected');
		}

		// add class selected to current target
		target.classList.add('selected');

		// save the selected racer to the store
		store.player_id = target.id;
	}
	catch (error) {
		console.log('Error while updating the selected racer ::', error);
	}
}

function handleSelectTrack(target) {
	try {
		console.log("selected a track", target.id);

		// remove class selected from all track options
		const selected = document.querySelector('#tracks .selected');
		if (selected) {
			if (selected == target) return;
			selected.classList.remove('selected');
		}

		// add class selected to current target
		target.classList.add('selected');

		// save the selected track id to the store
		store.track_id = target.id;
	}
	catch (error) {
		console.log('Error while updating the selected track ::', error);
	}
}

function handleAccelerate(raceID) {
	console.log("accelerate button clicked");
	// TODO - Invoke the API call to accelerate
	accelerate(raceID);
}

// HTML VIEWS ------------------------------------------------
// Provided code - do not remove

function renderRacerCars(racers) {
	if (!racers.length) {
		return `
			<h4>Loading Racers...</4>
		`
	}

	const results = racers.map(renderRacerCard).join('')

	return `
		<ul id="racers">
			${results}
		</ul>
	`
}

function renderRacerCard(racer) {
	const { id, driver_name, top_speed, acceleration, handling } = racer

	return `
		<li class="card podracer" id="${id}">
			<h3>${driver_name}</h3>
			<p>Top Speed: ${top_speed}</p>
			<p>Acceleration: ${acceleration}</p>
			<p>Handling: ${handling}</p>
		</li>
	`
}

function renderTrackCards(tracks) {
	if (!tracks.length) {
		return `
			<h4>Loading Tracks...</4>
		`
	}

	const results = tracks.map(renderTrackCard).join('')

	return `
		<ul id="tracks">
			${results}
		</ul>
	`
}

function renderTrackCard(track) {
	const { id, name } = track

	return `
		<li id="${id}" class="card track">
			<h3>${name}</h3>
		</li>
	`
}

function renderCountdown(count) {
	return `
		<h2>Race Starts In...</h2>
		<p id="big-numbers">${count}</p>
	`
}

function renderRaceStartView(trackName) {
	return `
		<header>
			<h1>Race: ${trackName}</h1>
		</header>
		<main id="two-columns">
			<section id="leaderBoard">
				${renderCountdown(3)}
			</section>

			<section id="accelerate">
				<h2>Directions</h2>
				<p>Click the button as fast as you can to make your racer go faster!</p>
				<button id="gas-peddle">Click Me To Win!</button>
			</section>
		</main>
		<footer></footer>
	`
}

function resultsView(positions) {
	positions.sort((a, b) => (a.final_position > b.final_position) ? 1 : -1)

	return `
		<header>
			<h1>Race Results</h1>
		</header>
		<main>
			${raceProgress(positions)}
			<a class="button" href="/race">Start a new race</a>
		</main>
	`
}

function raceProgress(positions) {
	try {
		const userPlayer = positions.find((player) => parseInt(player.id) === parseInt(store.player_id));
		if (userPlayer) {
			userPlayer.driver_name += " (you)"
		};

		positions = positions.sort((a, b) => (a.segment > b.segment) ? -1 : 1)
		let count = 1

		const results = positions.map(p => {
			return `
				<tr>
					<td>
						<h3>${count++} - ${p.driver_name}</h3>
					</td>
				</tr>
			`
		})

		return `
			<main>
				<h3>Leaderboard</h3>
				<section id="leaderBoard">
					${results}
				</section>
			</main>
		`
	}
	catch (error) {
		console.log('Error in updating race board - raceProgress::', error)
	};
}

function renderAt(element, html) {
	const node = document.querySelector(element);

	node.innerHTML = html;
}

// ^ Provided code ^ do not remove


// API CALLS ------------------------------------------------

function defaultFetchOpts() {
	return {
		mode: 'cors',
		headers: {
			'Content-Type': 'application/json',
			'Access-Control-Allow-Origin': appVars.SERVER,
		},
	}
}

function getTracks() {
	// GET request to `${SERVER}/api/tracks`
	return fetch(`${appVars.SERVER}/api/tracks`)
		.then((res) => res.json())
		.catch(err => console.log("Error while getting the tracks from API ::", err));
}

function getRacers() {
	// GET request to `${SERVER}/api/cars`
	return fetch(`${appVars.SERVER}/api/cars`)
		.then((res) => res.json())
		.catch(err => console.log("Error while getting the cars from API ::", err));
}

function createRace(player_id, track_id) {
	player_id = parseInt(player_id)
	track_id = parseInt(track_id)
	const body = { player_id, track_id }

	return fetch(`${appVars.SERVER}/api/races`, {
		method: 'POST',
		...defaultFetchOpts(),
		dataType: 'jsonp',
		body: JSON.stringify(body)
	})
		.then(res => res.json())
		.catch(err => console.log("Problem with createRace request::", err))
}

function getRace(id) {
	// GET request to `${SERVER}/api/races/${id}`

	return fetch(`${appVars.SERVER}/api/races/${id}`)
		.then(res => res.json())
		.catch(err => console.log("Problem with createRace request::", err))
}

function startRace(id) {
	return fetch(`${appVars.SERVER}/api/races/${id}/start `, {
		method: 'POST',
		...defaultFetchOpts()
	})
		.catch((error) => console.log("Problem with startRace request::", error));
}

function accelerate(id) {
	return fetch(`${appVars.SERVER}/api/races/${id}/accelerate `, {
		method: 'POST',
		...defaultFetchOpts()
	})
		.catch((error) => console.log("Problem with startRace request::", error));
}
