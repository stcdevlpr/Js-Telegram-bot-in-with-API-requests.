# We need to develop a Telegram bot on Node.js that executes requests to an external API. A request to the API takes about 3 minutes, and the API supports no more than 5 simultaneous requests. If the limit on simultaneous requests is exhausted at the time of the request, you need to add the request to the queue.

Functionality description:
1. The bot must accept the /start command, after which the user has a button to send a request to the external API.
2. If the current active requests are less than 5, the bot immediately sends a request to the API.
3. If there are already 5 requests running at the same time, the new request should be placed in the queue and executed as soon as space is available.
4. After a request is executed, the bot should notify the user when its request is finished.
5. If the position in the queue has been updated, a message should be edited from the user with the new position

Translated with DeepL.com (free version)
