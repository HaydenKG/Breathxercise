<script>
    export let show;

    let current = "box";
    let explain = true;

    //0 = box b. 1 = equal b.
    function switchExplanation(explanation) {
        if (explanation == 0) {
            explain = true;
            current = "box";
        }
        if (explanation == 1) {
            explain = false;
            current = "equal";
        }
    }

    function StartExercise() {
        if (explain) {
            show = 1;
        } else {
            show = 2;
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
</script>

<main>
    <div class="landing-container" in:fade>
        <img
            id="logo"
            src="./media/BreathingLogo400.png"
            alt="Logo of application showing a windy icon in a circle"
        />
        <div class="selection">
            <p>Choose from the following:</p>

            <button
                class={current === "box" ? "selection-btn" : "unselected"}
                on:click={() => switchExplanation(0)}
            >
                <h2>Box breathing</h2>
            </button>
            <hr />
            <button
                class={current === "equal" ? "selection-btn" : "unselected"}
                on:click={() => switchExplanation(1)}
            >
                <h2>Equal breathing</h2>
            </button>
        </div>

        <div class="explanation-container">
            {#if explain}
                <section class="explanation" in:fade>
                    <h2>Box breathing</h2>
                    <pre>
            Is a breathing pattern that can help to reduce stress or enhance focus by calming the mind and nervous system.

            You inhale, hold the breath, exhale and hold the breath again for the same amount of time.
            For example 4-4-4-4. 
            When this pattern is visualized, it looks like a box. 
            </pre>
                </section>
            {:else}
                <section class="explanation" in:fade>
                    <h2>Equal breathing</h2>
                    <pre>
                        Is a breathing pattern that has the same set count during the in- and exhale.
                        For example 4-4.
                        It can help to bring back focus on one's breathing and therefore enhance awareness of bodily sensations. 
                    </pre>
                </section>
            {/if}
        </div>
        <button id="jumpto-btn" on:click={StartExercise}>Start</button>
    </div>
</main>

<style>
    pre {
        white-space: pre-line;
        font-family: inherit;
    }

    hr {
        width: 50%;
        background-color: white;
    }

    .landing-container {
        display: flex;
        flex-direction: row;
        width: 100%;
        height: 100vh;
        justify-content: center;
    }

    .selection {
        display: flex;
        flex-direction: column;
        width: 50%;
        justify-content: center;
        align-items: center;
        font-size: 1.1rem;
    }

    .selection-btn {
        color: white;
        width: 50%;
        background-color: unset;
        border-width: 0;
    }

    .selection-btn:focus {
        background-color: unset;
    }

    .unselected {
        color: rgb(175 175 175);
        width: 50%;
        background-color: unset;
        border-width: 0;
    }

    .unselected:hover {
        text-decoration: underline;
    }

    .unselected:focus {
        background-color: unset;
    }

    .explanation-container {
        display: flex;
        justify-content: center;
        align-items: center;
        width: 50%;
        background-color: #393939;
    }

    .explanation {
        margin: 16%;
    }

    #jumpto-btn {
        position: absolute;
        top: 85%;
        background-color: unset;
        color: white;
        border-width: 3px;
        border-radius: 8px;
        width: 90px;
        font-size: 1.15em;
    }

    #jumpto-btn:hover {
        border-color: steelblue;
    }

    #logo {
        position: absolute;
        top: 2%;
        width: 10%;
        min-width: 65px;
        max-width: 130px;
    }

    @media only screen and (max-width: 600px) {
        h2 {
            margin: 0.1em;
        }

        #logo {
            position: initial;
        }

        .landing-container {
            flex-direction: column;
            width: 100%;
            height: 100vh;
            align-items: center;
        }

        .selection-btn {
            width: 85%;
        }

        .unselected {
            width: 85%;
        }

        .selection {
            display: flex;
            flex-direction: column;
            width: 100%;
            justify-content: center;
            align-items: center;
            font-size: 1.1rem;
        }

        .explanation-container {
            width: 100%;
        }

        .explanation {
            margin: 8%;
        }

        #jumpto-btn {
            position: sticky;
        }
    }
</style>
