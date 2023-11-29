<script lang="ts">
	import Player from '$lib/components/Player.svelte';

	const setDrmRequestHeader = (event: CustomEvent) => {
		const { type, request, shaka } = event.detail;

		if (type == shaka.net.NetworkingEngine.RequestType.LICENSE) {
			request.headers['X-AxDRM-Message'] =
				'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ2ZXJzaW9uIjoxLCJjb21fa2V5X2lkIjoiYjMzNjRlYjUtNTFmNi00YWUzLThjOTgtMzNjZWQ1ZTMxYzc4IiwibWVzc2FnZSI6eyJ0eXBlIjoiZW50aXRsZW1lbnRfbWVzc2FnZSIsImtleXMiOlt7ImlkIjoiOWViNDA1MGQtZTQ0Yi00ODAyLTkzMmUtMjdkNzUwODNlMjY2IiwiZW5jcnlwdGVkX2tleSI6ImxLM09qSExZVzI0Y3Iya3RSNzRmbnc9PSJ9XX19.4lWwW46k-oWcah8oN18LPj5OLS5ZU-_AQv7fe0JhNjA';
		}
	};
</script>

<div class="grid place-items-center min-h-screen">
	<Player
		--primaryColor="red"
		src="https://media.axprod.net/TestVectors/v7-MultiDRM-SingleKey/Manifest_1080p.mpd"
		disablepictureinpicture={true}
		crossorigin="anonymous"
		class="w-full max-w-4xl mx-auto"
		configuration={{
			abr: { defaultBandwidthEstimate: 10000000 },
			drm: {
				servers: {
					'com.widevine.alpha': 'https://drm-widevine-licensing.axtest.net/AcquireLicense'
				}
			}
		}}
		on:requestHeader={setDrmRequestHeader}
		subtitles={[
			{
				label: 'English',
				src: '/subtitles/TOS-en.vtt',
				srclang: 'en',
				kind: 'subtitles'
			}
		]}
	/>
</div>
