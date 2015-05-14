var indico = require('indico.io');
indico.apiKey = "da921676219f8f3e9aee66f98ae9c948";



module.exports = {
	getSentiment: function(words, cb)
	{
		indico.sentiment(words)
	  .then(function(res) {
	  	cb(res * 2 - 1);
	  }).catch(function(err) {
	    console.warn(err);
	  });
	},

	batchGetSentiment: function(listOfWords, cb)
	{
		indico.batchSentiment(listOfWords)
	  .then(function(res) {
	    cb(res);
	  }).catch(function(err) {
	    console.warn(err);
	  });
	}
}