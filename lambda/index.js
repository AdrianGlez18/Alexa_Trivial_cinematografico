const Alexa = require('ask-sdk-core');
const persistenceAdapter = require('ask-sdk-s3-persistence-adapter');

const LaunchRequestHandler = {
    //Aqui se selecciona el modo, y no se vuelve a ejecutar.
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'LaunchRequest'
        || Alexa.getRequestType(handlerInput.requestEnvelope) === 'GameModeIntent'
        || Alexa.getRequestType(handlerInput.requestEnvelope) === 'AnswerQuestionIntent';
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

const GameModeIntentHandler = {
    //Este solo introduce el juego y confirma que se quiere jugar, pero de momento no manda el mensaje y entra directamente. Luego lo cambiamos
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && (Alexa.getIntentName(handlerInput.requestEnvelope) === 'InGameIntent'
            || Alexa.getIntentName(handlerInput.requestEnvelope) === 'GameModeIntent')
    },
    handle(handlerInput) {
        const speechText = "Has entrado al modo de juego. Te haré 5 preguntas, y veremos cuántas de ellas has logrado acertar. ¿Te animas?";

        return handlerInput.responseBuilder
            .speak(speechText)
            .getResponse() && InGameIntentHandler.handle(handlerInput);
    }
    
};

const InGameIntentHandler = {
    ////////////////////////////////////////////////////////////////////////////
    ///////Este seria el que se ejecuta hasta que acaben las preguntas///////////
    ////////////////////////////////////////////////////////////////////////////
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && (Alexa.getIntentName(handlerInput.requestEnvelope) === 'InGameIntent')
    },
    handle(handlerInput) {
        const questionText = getQuestion();
        currentStatus = 'Question';
        const speakOutput = "Pregunta: " + questionText;
        return handlerInput.responseBuilder
        .speak(speakOutput)
        .reprompt(speakOutput)
        .getResponse();
    }
}

const AnswerQuestionIntentHandler = {
    ////////////////////////////////////////////////////////////////
    //Este seria para la parte donde nosotros preguntamos///////////
    ///////////////////////////////////////////////////////////////
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && (Alexa.getIntentName(handlerInput.requestEnvelope) === 'AnswerQuestionIntent')
    },
    handle(handlerInput) {
        return handlerInput.responseBuilder
        .speak("Iniciado AnswerQuestionIntent")
        .getResponse();
    }
}

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
        //De aqui para abajo es copiado de la plantilla/////////////////
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
                .getResponse();
        } 
        else {
            return handlerInput.responseBuilder
                .speak(speakOutput)
                .reprompt(speakOutput)
                .getResponse();
        }
        ///////////////////////////////////////
        /////////Hasta aqui///////////////////
        ////////////////////////////////////
    }
};

const StoreToListIntentHandler = {
    ////////////////////////////////////////////////////////////////
    // Esto es para guarda pelis a memoria persistente   ///////////
    ///////////////////////////////////////////////////////////////
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

const MyListIntentHandler = {
    ////////////////////////////////////////////////////////////////
    // Esto es para ver los pelis guardados             ///////////
    ///////////////////////////////////////////////////////////////
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

const DeleteFromListIntentHandler = {
    ////////////////////////////////////////////////////////////////
    // Esto es para borrar pelis de memoria persistente   ///////////
    ///////////////////////////////////////////////////////////////
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


//Todos estos son por defecto, solo cambie los textos y poco mas
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

//Todos estos son por defecto, solo cambie los textos y poco mas
const CancelAndStopIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && (Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.CancelIntent'
                || Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.StopIntent');
    },
    handle(handlerInput) {
        const speakOutput = 'Gracias por utilizar trivial cinematográfico, una skill desarrollada por Adrian y Thaddeus. Esperamos volver a oirte pronto.';

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .getResponse();
    }
};

//Todos estos son por defecto, solo cambie los textos y poco mas
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
let currentIndex,currentquest, currentStatus, questionsList, datalist, hits, exit, count;

//Esta es la lista de preguntas de las que va seleccionando el programa. Cuando este acabado, se reemplaza esto por la funcion de seleccionar 5 elementos aleatorios del fichero, ya que de aqui se van borrando
//para evitar preguntas duplicadas.
function initialize() {
    questionsList = {
      '0': {
        'invoce' : 'year',
        'quest' : 'En que año salio la película',
        'ans': 'Correcto, Esta peli salio en '
      },
      '1': {
        'invoce' : 'genre',
        'quest' : 'A que género pertenece ',
        'ans': 'Correcto, También pertence al género de '
      },
      '2': {
        'invoce' : 'protagonist',
        'quest' : 'Dime un protagonista de la pelicula ',
        'ans': 'Correcto, Otros serían '
      }
    };
    datalist = {
        '0' : {
            'id' : '0',
            'title' : 'Matrix',
            'year' : '1999',
            'genre' : ['ciencia ficción', 'acción'],
            'protagonist' : ['keanu reeves','laurence fishburne','carrie-anne moss','hugo weaving','joe pantoliano','marcus chong','paul goddard','gloria foster']
        },
        '1' : {
            'id' : '1',
            'title' : 'Regreso al futuro',
            'year' : '1985',
            'genre' : ['ciencia ficción', 'aventuras','comedia'],
            'protagonist' : ['michael fox','christopher lloyd','crispin glover','lea thompson','thomas wilson']
        },
        '2' : {
            'id' : '2',
            'title' : 'Capitana Marvel',
            'year' : '2019',
            'genre' : ['ciencia ficción', 'acción','superhéroes'],
            'protagonist' : ['brie larson','samuel jackson','ben mendelsohn','djimon hounsou','lee pace','lashana lynch','gemma chan','clark gregg','annette bening','jude law']
        }
    };
    currentIndex = null;
    currentquest = null;
    count = 0;
    hits = 0;
    currentStatus = null;
    exit = false;
}

function getRandomItem(lst) {
    if (Object.keys(lst).length === 0) {
        return null;
    }
    return lst[Object.keys(lst)[Math.floor(Math.random()*Object.keys(lst).length)]];
}

//Esto también pienso cambiarlo
function getQuestion(random = true) {
    if (random) {
        currentIndex = getRandomItem(datalist);
        currentquest = getRandomItem(questionsList);
        if (currentIndex === null || count >= 5) {
            const speakOutput = 'Ya respondiste todas las preguntas! ... Has conseguido acertar ' + hits + ' de ' + count + ' preguntas.';
            exit = true;
            return speakOutput;
        }
        delete datalist[currentIndex.id];
        count++;
    }
    const speakOutput =  currentquest.quest + currentIndex.title + '? ';
    return speakOutput
}
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
        InGameIntentHandler,
        AnswerQuestionIntentHandler,
        AnswerIntentHandler,
        StoreToListIntentHandler,
        MyListIntentHandler,
        DeleteFromListIntentHandler,
        HelpIntentHandler,
        CancelAndStopIntentHandler,
        FallbackIntentHandler,
        SessionEndedRequestHandler,
        IntentReflectorHandler)
    .addErrorHandlers(
        ErrorHandler)
    .withCustomUserAgent('sample/hello-world/v1.2')
    .lambda();