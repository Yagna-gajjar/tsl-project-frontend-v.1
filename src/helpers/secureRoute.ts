const encode = (str: string) => new TextEncoder().encode(str);
const decode = (buffer: ArrayBuffer) => new TextDecoder().decode(buffer);

// Convert ArrayBuffer → Base64 URL-safe string
const arrayBufferToBase64Url = (buffer: ArrayBuffer): string =>
	btoa(String.fromCharCode(...new Uint8Array(buffer)))
		.replace(/\+/g, '-') // replace + with -
		.replace(/\//g, '_') // replace / with _
		.replace(/=+$/, ''); // remove padding

// Convert Base64 URL-safe string → ArrayBuffer
const base64UrlToArrayBuffer = (base64url: string): ArrayBuffer => {
	const base64 = base64url
		.replace(/-/g, '+')
		.replace(/_/g, '/')
		.padEnd(base64url.length + (4 - (base64url.length % 4)) % 4, '=');
	return Uint8Array.from(atob(base64), c => c.charCodeAt(0)).buffer;
};

// Derive key from secret
const getCryptoKey = async (secret: string): Promise<CryptoKey> => {
	const keyMaterial = await crypto.subtle.importKey(
		'raw',
		encode(secret),
		'PBKDF2',
		false,
		['deriveKey']
	);

	return crypto.subtle.deriveKey(
		{
			name: 'PBKDF2',
			salt: encode('salt123'),
			iterations: 100000,
			hash: 'SHA-256',
		},
		keyMaterial,
		{ name: 'AES-GCM', length: 256 },
		false,
		['encrypt', 'decrypt']
	);
};

export async function secureParam(
	input: string,
	mode: 'encrypt' | 'decrypt'
): Promise<string | null> {
	const secretKey = import.meta.env.VITE_APP_ROUTE_SECRET_KEY;

	try {
		const key = await getCryptoKey(secretKey);

		if (mode === 'encrypt') {
			const iv = crypto.getRandomValues(new Uint8Array(12));
			const encrypted = await crypto.subtle.encrypt(
				{ name: 'AES-GCM', iv },
				key,
				encode(input)
			);

			const full = new Uint8Array(iv.length + encrypted.byteLength);
			full.set(iv, 0);
			full.set(new Uint8Array(encrypted), iv.length);

			return arrayBufferToBase64Url(full.buffer); // URL-safe result
		}

		if (mode === 'decrypt') {
			const fullBuffer = base64UrlToArrayBuffer(input);
			const iv = fullBuffer.slice(0, 12);
			const data = fullBuffer.slice(12);

			const decrypted = await crypto.subtle.decrypt(
				{ name: 'AES-GCM', iv: new Uint8Array(iv) },
				key,
				data
			);

			return decode(decrypted);
		}

		return null;
	} catch (error) {
		console.error(`[secureParam] ${mode} failed:`, error);
		return null;
	}
}
