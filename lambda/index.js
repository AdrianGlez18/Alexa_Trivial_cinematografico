const Alexa = require('ask-sdk-core');
const persistenceAdapter = require('ask-sdk-s3-persistence-adapter');

const LaunchRequestHandler = {
    //Aqui se selecciona el modo, y no se vuelve a ejecutar.
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'LaunchRequest'
        || Alexa.getRequestType(handlerInput.requestEnvelope) === 'GameModeIntent';
    },
    handle(handlerInput) {
        initialize();
        const speakOutput = 'Bienvenido a trivial cinematografico. Puedes hacerme preguntas sobre peliculas, o puedo ponerte a prueba haciéndotelas yo. Para empezar, hazme una pregunta o dime quiero jugar.';

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(speakOutput)
            .getResponse();
    }
};

//Este handler se encarga de iniciar el modo de juego. Además, genera las nuevas preguntas desde el fichero, haciendo llamadas a metodos para obtenerlo.
const GameModeIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && (Alexa.getIntentName(handlerInput.requestEnvelope) === 'InGameIntent'
            || Alexa.getIntentName(handlerInput.requestEnvelope) === 'GameModeIntent')
    },
    
    handle(handlerInput) {
        if(firstPlay === 0){
            const speechText = "Has entrado al modo de juego. Te haré 3 preguntas, y veremos cuántas de ellas has logrado acertar. ¿Te animas?";
            firstPlay++;
            return handlerInput.responseBuilder
                .speak(speechText)
                .reprompt(speechText)
                .getResponse();
        }
        const questionText = getQuestion();
        currentStatus = 'Question';
        const speakOutput = questionText;
        return handlerInput.responseBuilder
        .speak(speakOutput)
        .reprompt(speakOutput)
        .getResponse();
    }
    
};

//Handler encargado de gestionar el flujo del juego del trivial, y conmprobar si las respuestas son correctas o no.
const AnswerIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'AnswerIntent';
    },
    handle(handlerInput) {
        //const AnswerValue = handlerInput.requestEnvelope.request.intent.slots.year.value;   //Aqui de momento puse year, pero haría falta un condicional segun el tipo de dato. Por eso decia lo de questionType.
        let AnswerValue = ''
        if (currentquest.invoce === 'year') {
         AnswerValue = handlerInput.requestEnvelope.request.intent.slots.year.value;
          }
          else if (currentquest.invoce === 'genre') {
             AnswerValue = handlerInput.requestEnvelope.request.intent.slots.genre.value;
          }
          else {
             AnswerValue = handlerInput.requestEnvelope.request.intent.slots.actor.value;
          }
        /////////////////////////////////////////////////////////////////
        ////////De aqui para abajo se comprueban las preguntas//////////
        ////////////////////////////////////////////////////////////////
        let speakOutput = '';
        if (currentStatus === 'Continue') {
            speakOutput += 'Responde sí o no';
        }
        else {
            if (currentquest.invoce === 'year') {
                if (AnswerValue === currentIndex.year) {
                    speakOutput += 'Respuesta correcta! ... ' + '.';
                    hits++;
                }
                else  {
                    speakOutput += 'Respuesta incorrecta, la respuesta correcta es ' +  currentIndex.year+ /*' porque ' + currentIndex.answer + */ '.'; //Esto de momento no lo usamos
                }
          }
          else {
              //speakOutput += '         ' + AnswerValue + '           ';
                if (currentIndex[currentquest.invoce].includes(AnswerValue)) {
                    let cvpfarr = ''
                    for (var i = 0; i < currentIndex[currentquest.invoce].length; i++) {
                        if (currentIndex[currentquest.invoce][i] !== AnswerValue) {
                            cvpfarr += currentIndex[currentquest.invoce][i]+' , '
                        }
                    }
                    speakOutput += 'Respuesta correcta! ...  otras respuestas hubieran sido: ' + cvpfarr + '.';
                    hits++;
                }
                else  {
                    let cvpfarr = ''
                    for (var j = 0; j < currentIndex[currentquest.invoce].length; j++) {
                        cvpfarr += currentIndex[currentquest.invoce][j]
                        if (j < currentIndex[currentquest.invoce].length-1) {
                            cvpfarr += ' o '
                        }
                    }
                    speakOutput += 'Respuesta incorrecta, la respuesta seria '+ cvpfarr +'.'; //Esto de momento no lo usamos
                }
          }
        }
        currentIndex = null;
        speakOutput += ' ... Continuamos? ';
        currentStatus = 'Continue';
        
        if (exit) {
            return handlerInput.responseBuilder
                .speak(speakOutput)
                .reprompt(speakOutput)
                .getResponse();
        } 
        else {
            return handlerInput.responseBuilder
                .speak(speakOutput)
                .reprompt(speakOutput)
                .getResponse();
        }
    }
};

//Hace una petición para obtener la fecha de estreno y reformatea la respuesta.
const AnswerDateQuestionIntentHandler = {
    canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'LaunchRequest'
      || (handlerInput.requestEnvelope.request.type === 'IntentRequest'
      && handlerInput.requestEnvelope.request.intent.name === 'AnswerDateQuestionIntent');
  },
  
  async handle(handlerInput) {
    let outputSpeech = 'This is the default message.';
    let AnswerValue = '';
    AnswerValue = handlerInput.requestEnvelope.request.intent.slots.movie.value;
    AnswerValue= AnswerValue.replace(/ /g,"+");
    let movieID = ''
         
         await getRemoteData('https://api.themoviedb.org/3/search/movie?api_key=5e03a0a0072d0569232bf72951b90803&query=' + AnswerValue)
      .then((response) => {
        const data = JSON.parse(response);
        let releaseDate = data.results[0].release_date;
        let paramDate = releaseDate.split("-");
        var meses = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
        AnswerValue= AnswerValue.replace("+",/ /g);
        outputSpeech = `La pelicula ${AnswerValue} se estrenó el ${paramDate[2]} de ${meses[paramDate[1]-1]} del año ${paramDate[0]}. `;
        movieID = data.results[0].id;
      })
      .catch((err) => {
        console.log(`ERROR: ${err.message}`);
         outputSpeech = "No he podido encontrar la respuesta a esa pregunta. Por favor, inténtalo en otra ocasion.";
      });
          
    return handlerInput.responseBuilder
      .speak(outputSpeech)
      .reprompt(outputSpeech + "Si quieres, puedes hacerme otra pregunta o decirme quiero jugar.")
      .getResponse();
  },
}

//Hace dos peticiones para obtener la sinopsis de una pelicula.
const AnswerOverviewQuestionIntentHandler = {
    canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'LaunchRequest'
      || (handlerInput.requestEnvelope.request.type === 'IntentRequest'
      && handlerInput.requestEnvelope.request.intent.name === 'AnswerOverviewQuestionIntent');
  },
  
  async handle(handlerInput) {
    let outputSpeech = 'This is the default message.';
    let AnswerValue = '';
    AnswerValue = handlerInput.requestEnvelope.request.intent.slots.movie.value;
    AnswerValue= AnswerValue.replace(/ /g,"+");
    let movieID = ''
         
      await getRemoteData('https://api.themoviedb.org/3/search/movie?api_key=5e03a0a0072d0569232bf72951b90803&query=' + AnswerValue)
      .then((response) => {
        const data = JSON.parse(response);
        movieID = data.results[0].id;
      })
      .catch((err) => {
        console.log(`ERROR: ${err.message}`);
         outputSpeech = "No he podido encontrar la respuesta a esa pregunta. Por favor, inténtalo en otra ocasion.";
      });
      
      await getRemoteData('https://api.themoviedb.org/3/movie/' + movieID + '?api_key=5e03a0a0072d0569232bf72951b90803&language=es-ES')
      .then((response) => {
        const data = JSON.parse(response);
        let view = data.overview;
        outputSpeech = view;
      })
      .catch((err) => {
        console.log(`ERROR: ${err.message}`);
         outputSpeech = "No he podido encontrar la respuesta a esa pregunta. Por favor, inténtalo en otra ocasion.";
      });
          
    return handlerInput.responseBuilder
      .speak(outputSpeech)
      .reprompt(outputSpeech + "Si quieres, puedes hacerme otra pregunta o decirme quiero jugar.")
      .getResponse();
  },
}

//Hace dos peticiones para obtener el listado de generos a los que pertenece una pelicula.
const AnswerGenreQuestionIntentHandler = {
    canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'LaunchRequest'
      || (handlerInput.requestEnvelope.request.type === 'IntentRequest'
      && handlerInput.requestEnvelope.request.intent.name === 'AnswerGenreQuestionIntent');
  },
  
  async handle(handlerInput) {
    let outputSpeech = 'This is the default message.';
    let AnswerValue = '';
    AnswerValue = handlerInput.requestEnvelope.request.intent.slots.movie.value;
    AnswerValue= AnswerValue.replace(/ /g,"+");
    let movieID = '', movieTitle = '';
    let genreArray = [];
         
      await getRemoteData('https://api.themoviedb.org/3/search/movie?api_key=5e03a0a0072d0569232bf72951b90803&query=' + AnswerValue)
      .then((response) => {
        const data = JSON.parse(response);
        movieID = data.results[0].id;
      })
      .catch((err) => {
        console.log(`ERROR: ${err.message}`);
         outputSpeech = "No he podido encontrar la respuesta a esa pregunta. Por favor, inténtalo en otra ocasion.";
      });
      
      await getRemoteData('https://api.themoviedb.org/3/movie/' + movieID + '?api_key=5e03a0a0072d0569232bf72951b90803&language=es-ES')
      .then((response) => {
        const genreData = JSON.parse(response);
        let genreArray = genreData.genres;
        movieTitle = genreData.title;
        outputSpeech = movieTitle + ' pertenece a los siguientes géneros: ';

        if(genreArray.length > 1) {
            genreArray.forEach(item => {
                outputSpeech += item.name + ',';
            })
        }
        else {
            outputSpeech = 'La pelicula es de ' + genreArray[0].name + '.';
        }
      })
      .catch((err) => {
        console.log(`ERROR: ${err.message}`);
         outputSpeech = "No he podido encontrar la respuesta a esa pregunta. Por favor, inténtalo en otra ocasion.";
      });
          
          
    return handlerInput.responseBuilder
      .speak(outputSpeech)
      .reprompt(outputSpeech + "Si quieres, puedes hacerme otra pregunta o decirme quiero jugar.")
      .getResponse();
  },
}

//Guarda pelis en memoria persistente
const StoreToListIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && (Alexa.getIntentName(handlerInput.requestEnvelope) === 'StoreToListIntent')
    },
    async handle(handlerInput) {
        //loading persistent atributes
        let {attributesManager} = handlerInput;
        let persistentAttributes = await attributesManager.getPersistentAttributes() || {};
        
        //store data of all movies
        let mov = handlerInput.requestEnvelope.request.intent.slots.movie.value;
        if (persistentAttributes.hasOwnProperty('movies')) {
            if (!persistentAttributes.movies.includes(mov)) {
                persistentAttributes.movies.push(mov)
            }
        } else {
            persistentAttributes.movies = []
            persistentAttributes.movies.push(mov)
        }
        
        attributesManager.setPersistentAttributes(persistentAttributes);
            
        await attributesManager.savePersistentAttributes();
        
        let speakOutput = mov+" Añadido a la lista"
        return handlerInput.responseBuilder
        .speak(speakOutput)
        .reprompt(speakOutput)
        .getResponse();
    }
}

//Muestra las pelis guardadas en memoria persistente
const MyListIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && (Alexa.getIntentName(handlerInput.requestEnvelope) === 'MyListIntent')
    },
    async handle(handlerInput) {
        //loading persistent atributes
        let {attributesManager} = handlerInput;
        let persistentAttributes = await attributesManager.getPersistentAttributes() || {};
        
        //retrieve data of all movies
        let speakOutput = ''
        if (!persistentAttributes.hasOwnProperty('movies')) {
            speakOutput = 'Tu lista de peliculas esta vacía'
        } else {
            if (persistentAttributes.movies.length <= 0) {
                speakOutput = 'Tu lista de peliculas esta vacía'
            } else {
                speakOutput = 'Tienes las siguientes pelis guardados: '
                for (var i = 0; i < persistentAttributes.movies.length; i++) {
                    speakOutput += persistentAttributes.movies[i] + ", ";
                }
            }
        }
        
        await attributesManager.savePersistentAttributes();
        
        return handlerInput.responseBuilder
        .speak(speakOutput)
        .reprompt(speakOutput)
        .getResponse();
    }
}

//Borra pelis de memoria persistente
const DeleteFromListIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && (Alexa.getIntentName(handlerInput.requestEnvelope) === 'DeleteFromListIntent')
    },
    async handle(handlerInput) {
        //loading persistent atributes
        let {attributesManager} = handlerInput;
        let persistentAttributes = await attributesManager.getPersistentAttributes() || {};
        
        //store data of all movies
        let mov = handlerInput.requestEnvelope.request.intent.slots.movie.value;
        let speakOutput = ''
        if (persistentAttributes.hasOwnProperty('movies')) {
            if (persistentAttributes.movies.includes(mov)) {
                persistentAttributes.movies.splice(mov,1)
                speakOutput = mov + ' borrado de la lista.'
            }
        }
        
        if (speakOutput === '') {
            speakOutput = mov + ' no esta en la lista'
        }
        
        attributesManager.setPersistentAttributes(persistentAttributes);
            
        await attributesManager.savePersistentAttributes();
        
        return handlerInput.responseBuilder
        .speak(speakOutput)
        .reprompt(speakOutput)
        .getResponse();
    }
}

//Gestor de ayudas
const HelpIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.HelpIntent';
    },
    handle(handlerInput) {
        const speakOutput = 'Si tienes alguna duda, no dudes en preguntarme.';

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(speakOutput)
            .getResponse();
    }
};

//Detiene el flujo del programa si el usuario indica que desea salir
const CancelAndStopIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && (Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.CancelIntent'
                || Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.StopIntent'
                || Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.NoIntent');
    },
    handle(handlerInput) {
        const speakOutput = 'Gracias por utilizar trivial cinematográfico, una skill desarrollada por Adrian y Thaddeus. Esperamos volver a oirte pronto.';

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .getResponse();
    }
};

//Gestor de excepciones. Se llama si se utiliza alguna palabra no detectada por la skill
const ExceptionIntentHandler = {
    canHandle(handlerInput) {
        return true;
    },
    handle(handlerInput){
        const speakOutput = "Lo siento, no entendí bien que querías decir con eso. ¿Puedes probar con otra cosa, por favor?";
        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(speakOutput)
            .getResponse();
    }
};

const FallbackIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.FallbackIntent';
    },
    handle(handlerInput) {
        const speakOutput = 'Lo siento, no te entendi. Intentalo de nuevo.';

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(speakOutput)
            .getResponse();
    }
};

/* *
 * SessionEndedRequest notifies that a session was ended. This handler will be triggered when a currently open 
 * session is closed for one of the following reasons: 1) The user says "exit" or "quit". 2) The user does not 
 * respond or says something that does not match an intent defined in your voice model. 3) An error occurs 
 * */
const SessionEndedRequestHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'SessionEndedRequest';
    },
    handle(handlerInput) {
        console.log(`~~~~ Session ended: ${JSON.stringify(handlerInput.requestEnvelope)}`);
        // Any cleanup logic goes here.
        return handlerInput.responseBuilder.getResponse(); // notice we send an empty response
    }
};
/* *
 * The intent reflector is used for interaction model testing and debugging.
 * It will simply repeat the intent the user said. You can create custom handlers for your intents 
 * by defining them above, then also adding them to the request handler chain below 
 * */
const IntentReflectorHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest';
    },
    handle(handlerInput) {
        const intentName = Alexa.getIntentName(handlerInput.requestEnvelope);
        const speakOutput = `You just triggered ${intentName}`;

        return handlerInput.responseBuilder
            .speak(speakOutput)
            //.reprompt('add a reprompt if you want to keep the session open for the user to respond')
            .getResponse();
    }
};
/**
 * Generic error handling to capture any syntax or routing errors. If you receive an error
 * stating the request handler chain is not found, you have not implemented a handler for
 * the intent being invoked or included it in the skill builder below 
 * */
const ErrorHandler = {
    canHandle() {
        return true;
    },
    handle(handlerInput, error) {
        const speakOutput = 'Sorry, I had trouble doing what you asked. Please try again.';
        console.log(`~~~~ Error handled: ${JSON.stringify(error)}`);

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(speakOutput)
            .getResponse();
    }
};
//Variables necesarias
var currentIndex,currentquest, currentStatus, questionsList, datalist, hits, exit, count, firstPlay;

//Esta es la lista de preguntas de las que va seleccionando el programa. Al llamarse, reinicia las variables necesarias y genera un listado de preguntas desde el fichero
async function initialize() {
    questionsList = require('./movie_data_questions.js');
    datalist = require('./movie_data.js');
    currentIndex = null;
    currentquest = null;
    count = 0;
    hits = 0;
    firstPlay = 0;
    currentStatus = null;
    exit = false;
}

//Obtiene un elemento aleaatorio de una lista o vector
function getRandomItem(lst) {
    if (Object.keys(lst).length === 0) {
        return null;
    }
    return lst[Object.keys(lst)[Math.floor(Math.random()*Object.keys(lst).length)]];
}

//Elige una pregunta aleatoria de la lista, y notifica cuando ya se han hecho todas
function getQuestion(random = true) {
    if (random) {
        currentIndex = getRandomItem(datalist);
        currentquest = getRandomItem(questionsList);
        if (currentIndex === null || count >= 3) {
            const speakOutput = 'Ya respondiste todas las preguntas! ... Has conseguido acertar ' + hits + ' de ' + count + ' preguntas.';
            exit = true;
            datalist = {};
            initialize()
            return speakOutput;
        }
        delete datalist[currentIndex.id];
        count++;
    }
    const speakOutput =  currentquest.quest + currentIndex.title + '? ';
    return speakOutput
}

//Encargado de la peticion GET a la API y del control de los codigos retornados.
const getRemoteData = (url) => new Promise((resolve, reject) => {
  const client = url.startsWith('https') ? require('https') : require('http');
  const request = client.get(url, (response) => {
    if (response.statusCode < 200 || response.statusCode > 299) {
      reject(new Error(`Failed with status code: ${response.statusCode}`));
    }
    const body = [];
    response.on('data', (chunk) => body.push(chunk));
    response.on('end', () => resolve(body.join('')));
  });
  request.on('error', (err) => reject(err));
});


/**
 * This handler acts as the entry point for your skill, routing all request and response
 * payloads to the handlers above. Make sure any new handlers or interceptors you've
 * defined are included below. The order matters - they're processed top to bottom 
 * */
exports.handler = Alexa.SkillBuilders.custom()
    .withPersistenceAdapter(
        new persistenceAdapter.S3PersistenceAdapter({bucketName:process.env.S3_PERSISTENCE_BUCKET})
    )
    .addRequestHandlers(
        LaunchRequestHandler,
        GameModeIntentHandler,
        AnswerGenreQuestionIntentHandler,
        AnswerDateQuestionIntentHandler,
        AnswerOverviewQuestionIntentHandler,
        AnswerIntentHandler,
        StoreToListIntentHandler,
        MyListIntentHandler,
        DeleteFromListIntentHandler,
        HelpIntentHandler,
        CancelAndStopIntentHandler,
        ExceptionIntentHandler,
        FallbackIntentHandler,
        SessionEndedRequestHandler,
        IntentReflectorHandler)
    .addErrorHandlers(ErrorHandler)
    .withCustomUserAgent('sample/hello-world/v1.2')
    .lambda();
