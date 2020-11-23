const Alexa = require('ask-sdk-core');

const LaunchRequestHandler = {
    //Aqui se selecciona el modo, y no se vuelve a ejecutar.
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'LaunchRequest'
        || Alexa.getRequestType(handlerInput.requestEnvelope) === 'GameModeIntent'
        || Alexa.getRequestType(handlerInput.requestEnvelope) === 'AnswerQuestionIntent';
    },
    handle(handlerInput) {
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
        initialize();
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
        const AnswerValue = handlerInput.requestEnvelope.request.intent.slots.year.value;   //Aqui de momento puse year, pero haría falta un condicional segun el tipo de dato. Por eso decia lo de questionType.
        /////////////////////////////////////////////////////////////////
        //De aqui para abajo es copiado de la plantilla/////////////////
        ////////////////////////////////////////////////////////////////
        let speakOutput = '';
        if (currentStatus === 'Continue') {
            speakOutput += 'Responde sí o no';
        }
        else {
            if (AnswerValue === currentIndex.year) {
                speakOutput += 'Respuesta correcta! ... ' + '.';
                hits++;
            }
            else  {
                speakOutput += 'Respuesta incorrecta, la respuesta correcta es ' +  currentIndex.year+ /*' porque ' + currentIndex.answer + */ '.'; //Esto de momento no lo usamos
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
let currentIndex, currentStatus, questionsList, hits, exit, pending, count;

//Esta es la lista de preguntas de las que va seleccionando el programa. Cuando este acabado, se reemplaza esto por la funcion de seleccionar 5 elementos aleatorios del fichero, ya que de aqui se van borrando
//para evitar preguntas duplicadas.
function initialize() {
    questionsList = {
        '0' : {
        'id' : '0',
        'question' : '¿En que año se estrenó matrix?',
        'title' : 'Matrix',
        'year' : '1999',
        'genre' : ['Ciencia ficción', 'Acción'],
        'protagonists' : ['Keanu Reeves','Laurence Fishburne','Carrie-Anne Moss','Hugo Weaving','Joe Pantoliano','Marcus Chong','Paul Goddard','Gloria Foster']
    },
    '1' : {
        'id' : '1',
        'question' : '¿En que año se estrenó Regreso al fururo?',
        'title' : 'Regreso al futuro',
        'year' : '1985',
        'genre' : ['Ciencia ficción', 'Aventuras','Comedia'],
        'protagonists' : ['Michael Fox','Christopher Lloyd','Crispin Glover','Lea Thompson','Thomas Wilson']
    },
    '2' : {
        'id' : '2',
        'question' : '¿En que año se estrenó Capitana Marvel?',
        'title' : 'Capitana Marvel',
        'year' : '2019',
        'genre' : ['Ciencia ficción', 'Acción','Superhéroes'],
        'protagonists' : ['Brie Larson','Samuel Jackson','Ben Mendelsohn','Djimon Hounsou','Lee Pace','Lashana Lynch','Gemma Chan','Clark Gregg','Annette Bening','Jude Law']
    }
    
    }
}

function getRandomItem(lst) {
    if (Object.keys(lst).length === 0) {
        return null;
    }
    currentIndex =  lst[Object.keys(lst)[Math.floor(Math.random()*Object.keys(lst).length)]];
    return currentIndex;
}

//Esto también pienso cambiarlo
function getQuestion(random = true) {
    let speechText = '';
    if (random) {
        speechText = getRandomItem(questionsList);
        if (currentIndex === null && pending === null) {
            const speakOutput = 'Ya respondiste todas las preguntas! ... Has conseguido acertar ' + hits + ' de ' + count + ' preguntas.';
            exit = true;
            return speakOutput;
        }
        else if (currentIndex === null) {
            return 'Ya no te quedan más preguntas nuevas, pero sí te queda una pendiente, vamos con ella. ... ' + speechText.question + '? ';
        }
        delete questionsList[currentIndex.id];
        count++;
    }
    else {
        speechText = currentIndex;
    }
    const speakOutput =  speechText.question + '? ';
    return speakOutput
}
/**
 * This handler acts as the entry point for your skill, routing all request and response
 * payloads to the handlers above. Make sure any new handlers or interceptors you've
 * defined are included below. The order matters - they're processed top to bottom 
 * */
exports.handler = Alexa.SkillBuilders.custom()
    .addRequestHandlers(
        LaunchRequestHandler,
        GameModeIntentHandler,
        InGameIntentHandler,
        AnswerQuestionIntentHandler,
        AnswerIntentHandler,
        HelpIntentHandler,
        CancelAndStopIntentHandler,
        FallbackIntentHandler,
        SessionEndedRequestHandler,
        IntentReflectorHandler)
    .addErrorHandlers(
        ErrorHandler)
    .withCustomUserAgent('sample/hello-world/v1.2')
    .lambda();