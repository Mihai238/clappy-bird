# Tilt Bird

Flappy Bird played by moving your phone instead of tapping.

**Play:** https://mihai238.github.io/flappy-bird/ (open it on your phone)

## Controls

- **Flick:** jerk the phone to flap. Use the sensitivity slider if one flick gives two flaps, or none.
- **Tilt:** tilt the top of the phone up to climb and down to dive. The countdown takes your current angle as level.

Lock screen rotation in portrait. Tap or Space also flaps, and the arrow keys steer in Tilt mode, so it works on a computer too.

## Running locally

Phones only expose motion sensors to `https` pages. To play from your own machine over Wi-Fi:

```sh
python3 serve.py
```

It prints an `https://` address for your phone and creates a self-signed certificate on first run, so accept the browser warning once.
