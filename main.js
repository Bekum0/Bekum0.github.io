fetch('data.json')
.then(response => response.json())
.then(data => {
    setup(data);
});

const Toast = Swal.mixin({
    toast: true,
    position: 'top-end',
    showConfirmButton: false,
    timer: 3000,
    timerProgressBar: true,
    didOpen: (toast) => {
        toast.addEventListener('mouseenter', Swal.stopTimer)
        toast.addEventListener('mouseleave', Swal.resumeTimer)
    }
});

let yearId = null;
let dataYear = null;
let mode = null;

let allFrames = [];
let numberOfData = 0;
let currentFrameIndex = 0;

let quizletFrames = [];
let score = 0;

function setup(data) {
    Swal.fire({
        title: "Entrainement - Anatomie pathologique",
        showConfirmButton: false,
        allowEscapeKey: false, // Désactive la touche Échap
        allowOutsideClick: false,
        html: "<strong>Bienvenue !</strong><br/>En cette période de blocus, il est difficile de s'entrainer pour ANAT Path. Ce site vous permets de vous entrainer dans la reconaissance de coupes histologiques. Une coupe vous sera présentée avec un organe si mentionné. A vous de deviner celle-ci. Vous pourrez ensuite voir la réponse !<br/><br/><strong>Comment cela fonctionne ?</strong><br/>Une nouvelle page CYTOMINE va s'ouvrir en plein écran. <br/><strong><p style='color:red'>⚠️ATTENTION PARFOIS LE NOM DE LA COUPE EST MARQUÊ EN BAS A GAUCHE, CACHE LE AVEC UN SCTOCH, .. (IMPOSSIBLE DE LE CACHER MOI MÊME ...)</p></strong><br/>Une fois ton diagnostic établis, retourne sur cette page pour voir la réponse et passer à la coupe suivante.<br/><br/>Est-tu près ? Si oui, en quel année es-tu ?" +
        `<div class="btn-group mt-3">`+
        `<div class="me-2"><button type="button" class="btn btn-bac3 yearSelect" id="BAC3"><i class="fas fa-graduation-cap"></i> BAC 3</button></div>`+
        `<div class=""><button type="button" class="btn btn-master1 yearSelect" id="M1"><i class="fas fa-university"></i> Master 1</button></div>`+
        `</div>`,
    })

    $(".yearSelect").click(function() {
        let id = $(this).attr('id');
        let dataSelected = data[id];
    
        if (dataSelected === undefined) {
            Swal.fire({
                title: "Erreur",
                icon: "error",
                text: "Les données pour cette année ne sont pas encore disponibles. Veuillez réessayer plus tard."
            });

            return;
        }

        yearId = id;
        dataYear = dataSelected;

        // Deep copy
        allFrames = JSON.parse(JSON.stringify(dataYear["frames"]));
        allFrames = allFrames.sort(() => Math.random() - 0.5);

        numberOfData = allFrames.length;
        main();
    });
}

function main() {
    // Ask the play mode (Quizlet or Random)
        Swal.fire({
            title: "Mode de jeu",
            showConfirmButton: false,
            allowEscapeKey: false, // Désactive la touche Échap
            allowOutsideClick: false,
            html: "Choisissez le mode de jeu<br/><br/>🌟Nombre de coupes : <strong>"+allFrames.length+"🌟</strong><br/><br/><strong>● Quizlet : </strong> Comme sur quizlet (J'avais pas de nom pour définir ça ...), si vous avez une coupe correcte, celle-ci sort de la liste jusqu'à ce que la liste soit vide !<br/><br/><strong>● Aléatoire : </strong> A chaque fois une coupe aléatoire est choisie, tu peux passer 2 fois sur la même<br/><br/><strong>● Aléatoire x1 : </strong>Les coupes sont aléatoires mais ne passent qu'une seule fois ! Tu peux avoir ton score à la fin<br/>" +
            `<div class="btn-group mt-3">`+
            `<div class="me-2"><button type="button" class="btn btn-success modeSelect" id="quizlet">Quizlet</button></div>`+
            `<div class="me-2"><button type="button" class="btn btn-warning modeSelect" id="random">Aléatoire</button></div>`+
            `<div class=""><button type="button" class="btn btn-danger modeSelect" id="random1">Aléatoire x1</button></div>`+
            `</div>`,
        });

        $(".modeSelect").click(function() {
            mode = $(this).attr('id');

            let randomIndex = Math.floor(Math.random() * allFrames.length);
            let activeFrameData = allFrames[randomIndex];

            showFrame(activeFrameData, randomIndex);
        });
}

let isOktoClose = false;

function showFrame(activeFrameData, randomIndex) {
    let link = activeFrameData["link"];
    let organ = activeFrameData["bodyPart"];
    let name = activeFrameData["name"];

    currentFrameIndex++;
    isOktoClose = false;

    if (organ == "")
        organ = "Inconnu";

    let mywindow = window.open(link, "_blank", "location=no,menubar=no,scrollbars=no,status=no,titlebar=no,toolbar=no,fullscreen=yes");

    // check if is closed
    let timer = setInterval(function() {
        if (mywindow.closed && !isOktoClose) {
            mywindow = window.open(link, "_blank", "location=no,menubar=no,scrollbars=no,status=no,titlebar=no,toolbar=no,fullscreen=yes");
        }

        if (isOktoClose) {
            clearInterval(timer);
        }
    }, 1000);

    let coupeHtml = "🌟Coupe actuelle : "+currentFrameIndex+"/"+numberOfData+"🌟<br/><br/>";

    Swal.fire({
        title: "Quelle est cette coupe ?",
        showConfirmButton: false,
        allowEscapeKey: false, // Désactive la touche Échap
        allowOutsideClick: false,
        html: `🫀 Organe : <strong>${organ}</strong><br/><br/>${(mode == "quizlet" || mode == "random1")?coupeHtml:""}
        <div class="d-flex justify-content-center">`+
        `<div class="me-2"><button type="button" class="btn btn-primary" id="showAnswer">Voir la réponse</button></div>`+
        `<div class=""><button type="button" class="btn btn-warning" id="closeWindow">Fermer la fenêtre</button></div>`+
        `</div>`,
    });

    $("#showAnswer").click(function() {
        isOktoClose = true;
        if (mywindow) {
            mywindow.close();
        }

        Swal.fire({
            title: "Voici la réponse !",
            showConfirmButton: false,
            allowEscapeKey: false, // Désactive la touche Échap
            allowOutsideClick: false,
            html: `🔑 Réponse : <strong>${name}</strong><br/><br/>${(mode == "quizlet" || mode == "random1")?coupeHtml:""}<div class="d-flex justify-content-center">`+
            `<div class="me-2"><button type="button" class="btn btn-success giveReponse" id="1">Bonne réponse</button></div>`+
            `<div class=""><button type="button" class="btn btn-danger giveReponse" id="0">Mauvaise réponse</button></div>`+
            `</div>`,
        });

        $(".giveReponse").click(function() {
            let id = $(this).attr('id');

            if (mode == "quizlet" || mode == "random1") {
                allFrames.splice(randomIndex, 1);
            }

            if (id == "0") {
                if (mode == "quizlet") {
                    quizletFrames.push(activeFrameData);
                }
            }else
                score++;

            // Check if all frames are done
            if (allFrames.length == 0) {
                if (mode != "quizlet" || quizletFrames.length == 0) {
                    showEndGame();
                    return;
                }

                if (mode == "quizlet") {
                    allFrames = JSON.parse(JSON.stringify(quizletFrames));
                    quizletFrames = [];
                    numberOfData = allFrames.length;
                    currentFrameIndex = 0;
                }
            }

            randomIndex = Math.floor(Math.random() * allFrames.length);
            activeFrameData = allFrames[randomIndex];

            showFrame(activeFrameData,randomIndex);
        });

    });

    $("#closeWindow").click(function() {
        if (isOktoClose)
            return;

        if (!mywindow)
            return;

        isOktoClose = true;
        mywindow.close();
    });
}

function showEndGame() {
    Swal.fire({
        title: "Fin du jeu",
        showConfirmButton: false,
        allowEscapeKey: false, // Désactive la touche Échap
        allowOutsideClick: false,
        html: `🌟Félicitations ! Vous avez terminé toutes les coupes ! Vous pouvez dorénavent recommencer !<br/><br/>${(mode == "random1")?"💯 SCORE : <strong><span style='color:green'>"+score+"</span>/"+numberOfData+"</strong><br/><br/>":""}<div class="d-flex justify-content-center">`+
            `<div class="me-2"><button type="button" class="btn btn-info restart">Recommencer</button></div>`+
            `</div>`,
    });

    $(".restart").click(function() {
        allFrames = JSON.parse(JSON.stringify(dataYear["frames"]));;
        allFrames = allFrames.sort(() => Math.random() - 0.5);

        numberOfData = allFrames.length;
        main();
    });
}