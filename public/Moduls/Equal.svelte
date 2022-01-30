<script>
    export let show;

    /*----audio*/
    let inhaleAudio = new Audio("./media/Inhale.mp3");
    let exhaleAudio = new Audio("./media/Exhale.mp3");

    let boxtimer;
    let boxAnimation;

    let instruction = "Inhale for 4";
    let countdown = 4;
    let cycle = 0;
    let round = 1;
    let started = false;
    let width = 24;
    let inhale = 0;

    function returnToLanding() {
        show = 0;
        clearInterval(boxtimer);
        clearInterval(boxAnimation);
        inhaleAudio.pause();
        exhaleAudio.pause();
    }

    function startSession() {
        round = 0;
        started = true;
        equalbreathing();
    }

    function equalbreathing() {
        boxtimer = setInterval(() => {
            ++cycle;

            if (cycle == 9) {
                inhale = 0;
                cycle = 1;
                round++;
            }
            if (round > 5) {
                round = 5;
                instruction = "Well done";
                setTimeout(reset, 4000);
                width = 24;
                clearInterval(boxtimer);
                clearInterval(boxAnimation);
                inhale = 0;
                cycle = 0;
                return;
            }

            if (cycle <= 4) {
                inhale = 1;
                instruction = "Inhale for " + countdown--;
            } else if (cycle > 4 && cycle <= 8) {
                inhale = -1;
                instruction = "Exhale for " + countdown--;
            }
            if (cycle == 1) playAudio(0);
            if (cycle == 5) playAudio(1);
            if (countdown == 0) countdown = 4;
        }, 1000);

        boxAnimation = setInterval(() => {
            if (inhale > 0) {
                width += 0.04;
            } else if (inhale < 0) {
                width -= 0.04;
            }
        }, 10);
    }

    function reset() {
        started = false;
        round = 1;
        instruction = "";
    }

    // 0 = inhale || 1 = exhale
    function playAudio(variant) {
        if (audio) {
            if (variant == 0) inhaleAudio.play();
            if (variant == 1) exhaleAudio.play();
        }
    }

    function fade(node, { delay = 0, duration = 400 }) {
        const o = +getComputedStyle(node).opacity;

        return {
            delay,
            duration,
            css: (t) => `opacity: ${t * o}`,
        };
    }

    let audio = true;
    function audioController() {
        audio = !audio;
        console.log(audio);
        if (!audio) {
            inhaleAudio.pause();
            exhaleAudio.pause();
        }
    }
</script>

<main>
    <button id="home-btn" on:click={() => returnToLanding()}>
        <i class="material-icons" style="font-size: 38px;">chevron_left</i>
    </button>

    <button id="mute-btn" on:click={() => audioController()}>
        {#if audio}
            <i class="material-icons" style="font-size: 30px;">volume_up</i>
        {:else}
            <i class="material-icons" style="font-size: 30px;">volume_off</i>
        {/if}
    </button>
    <div class="equalbreathing" in:fade>
        <h2 id="round-display">Round: {round} / 5</h2>
        {#if !started}
            <button id="start-btn" on:click={() => startSession()} in:fade>
                <i class="material-icons">play_arrow</i>
            </button>
        {:else}
            <h1 in:fade out:fade>{instruction}</h1>
        {/if}
        <hr style="width: {width}%" />
    </div>
</main>

<style>
    hr {
        position: absolute;
        bottom: 42%;
        background-color: white;
        height: 5px;
        border-radius: 8px;
        width: 10%;
    }

    .equalbreathing {
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        height: 100vh;
    }
</style>
