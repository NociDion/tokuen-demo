const prefersReducedMotion = () =>
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const motionInstances = new WeakMap();

export const initAuthBackgroundMotion = () => {
    document.querySelectorAll('.tokuen-auth-bg').forEach((background) => {
        if (motionInstances.has(background) || prefersReducedMotion()) {
            return;
        }

        background.classList.add('is-js-animated');

        const auroraOne = background.querySelector('.tokuen-auth-aurora:not(.tokuen-auth-aurora-2)');
        const auroraTwo = background.querySelector('.tokuen-auth-aurora-2');
        const mesh = background.querySelector('.tokuen-auth-mesh');
        const ring = background.querySelector('.tokuen-auth-shape-ring');
        const blobs = [...background.querySelectorAll('.tokuen-auth-shape-blob')];
        const dots = [...background.querySelectorAll('.tokuen-auth-shape-dot')];

        let pointerX = 0;
        let pointerY = 0;
        let targetX = 0;
        let targetY = 0;
        let scrollY = 0;
        let frameId = 0;
        let startTime = performance.now();

        const updatePointer = (clientX, clientY) => {
            targetX = (clientX / window.innerWidth - 0.5) * 2;
            targetY = (clientY / window.innerHeight - 0.5) * 2;
        };

        const onMouseMove = (event) => updatePointer(event.clientX, event.clientY);
        const onTouchMove = (event) => {
            const touch = event.touches[0];
            if (touch) {
                updatePointer(touch.clientX, touch.clientY);
            }
        };

        const onScroll = () => {
            scrollY = window.scrollY || document.documentElement.scrollTop || 0;
        };

        window.addEventListener('mousemove', onMouseMove, { passive: true });
        window.addEventListener('touchmove', onTouchMove, { passive: true });
        window.addEventListener('scroll', onScroll, { passive: true });

        const animate = (now) => {
            const elapsed = (now - startTime) / 1000;
            pointerX += (targetX - pointerX) * 0.06;
            pointerY += (targetY - pointerY) * 0.06;

            const scrollOffset = Math.min(scrollY * 0.08, 48);

            if (auroraOne) {
                auroraOne.style.transform = `
                    translate3d(${pointerX * 28 + Math.sin(elapsed * 0.35) * 16}px, ${pointerY * 22 + scrollOffset + Math.cos(elapsed * 0.28) * 12}px, 0)
                    rotate(${Math.sin(elapsed * 0.2) * 6}deg)
                    scale(${1 + Math.sin(elapsed * 0.45) * 0.04})
                `;
            }

            if (auroraTwo) {
                auroraTwo.style.transform = `
                    translate3d(${pointerX * -22 + Math.cos(elapsed * 0.3) * 20}px, ${pointerY * -18 + scrollOffset * 0.6 + Math.sin(elapsed * 0.24) * 14}px, 0)
                    rotate(${Math.cos(elapsed * 0.18) * -8}deg)
                    scale(${1.06 + Math.cos(elapsed * 0.38) * 0.05})
                `;
            }

            if (mesh) {
                mesh.style.transform = `
                    translate3d(${pointerX * 10}px, ${pointerY * 8 + scrollOffset * 0.35}px, 0)
                `;
            }

            if (ring) {
                ring.style.transform = `
                    translate3d(${pointerX * 14}px, ${pointerY * 10 + scrollOffset * 0.2}px, 0)
                    scale(${1 + Math.sin(elapsed * 0.5) * 0.025})
                `;
            }

            blobs.forEach((blob, index) => {
                const wave = index + 1;
                blob.style.transform = `
                    translate3d(
                        ${pointerX * (10 + index * 7) + Math.sin(elapsed * 0.55 + wave) * 22}px,
                        ${pointerY * (8 + index * 5) + Math.cos(elapsed * 0.48 + wave) * 18 + scrollOffset * 0.15}px,
                        0
                    )
                    scale(${1 + Math.sin(elapsed * 0.6 + wave) * 0.08})
                `;
            });

            dots.forEach((dot, index) => {
                dot.style.transform = `
                    translate3d(
                        ${pointerX * (6 + index * 4) + Math.sin(elapsed * 0.9 + index) * 10}px,
                        ${pointerY * (5 + index * 3) + Math.cos(elapsed * 0.75 + index) * 8}px,
                        0
                    )
                    scale(${0.85 + Math.abs(Math.sin(elapsed * 1.2 + index)) * 0.35})
                `;
            });

            frameId = requestAnimationFrame(animate);
        };

        frameId = requestAnimationFrame(animate);

        motionInstances.set(background, () => {
            cancelAnimationFrame(frameId);
            window.removeEventListener('mousemove', onMouseMove);
            window.removeEventListener('touchmove', onTouchMove);
            window.removeEventListener('scroll', onScroll);
        });
    });
};
