define(['math/Random'], (Random) => {
	'use strict';

	return (GameManager) => {
		let game = null;
		let time0 = null;

		function sendState(pauseTriggered = false) {
			const now = Date.now();
			const state = game.getState();
			self.postMessage({
				action: 'STEP_COMPLETE',
				state: Object.assign({}, state, {
					realWorldTime: now - time0,
				}),
				pauseTriggered,
			});
		}

		self.addEventListener('message', (event) => {
			const data = event.data;

			switch(data.action) {
			case 'BEGIN':
				if(game != null) {
					throw new Error('Cannot re-use game worker');
				}
				time0 = Date.now();
				game = new GameManager(new Random(data.config.seed), data.config);
				sendState();
				break;

			case 'STEP':
				const limit = data.maxTime ? (Date.now() + data.maxTime) : 0;
				try {
					for(let i = 0; (data.steps < 0 || i < data.steps) && !game.isOver(); ++ i) {
						game.step(data.type);
						if(limit && Date.now() >= limit) {
							break;
						}
					}
					sendState();
				} catch(e) {
					if(e === 'PAUSE') {
						sendState(true);
					} else {
						throw e;
					}
				}
				break;

			case 'UPDATE_CONFIG':
				game.updateConfig(data.config);
				break;

			case 'UPDATE_ENTRY':
				game.updateEntry(data.entry);
				break;
			}
		});
	};
});
