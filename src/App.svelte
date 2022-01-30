<script>
	import Box from "../public/Moduls/Box.svelte";
	import Landing from "../public/Moduls/Landing.svelte";
	import Equal from "../public/Moduls/Equal.svelte";
	let show = 0;
</script>

<svelte:head>
	<link
		rel="stylesheet"
		href="https://fonts.googleapis.com/icon?family=Material+Icons"
	/>
</svelte:head>

<main>
	{#if show == 0}
		<Landing bind:show />
	{:else if show == 1}
		<Box bind:show />
	{:else if show == 2}
		<Equal bind:show />
	{/if}
</main>

<style>
	:global(body) {
		margin: 0;
		padding: 0;
		background-color: #2a2a2a;
	}

	main {
		text-align: center;
		max-width: 240px;
		margin: 0 auto;
		color: white;
		padding: 0;
	}

	@media (min-width: 640px) {
		main {
			max-width: none;
		}
	}
</style>
