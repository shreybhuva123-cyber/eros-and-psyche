import React, { useRef, useState, useMemo, useEffect, Suspense } from 'react';
import { Canvas, useFrame, useGraph } from '@react-three/fiber';
import { Environment, ContactShadows, useGLTF, useAnimations } from '@react-three/drei';
import { SkeletonUtils } from 'three-stdlib';
import { AnimatePresence, motion } from 'framer-motion';
import * as THREE from 'three';
import { useMascot } from '../context/MascotContext';

const GenuineMascot = ({ focusedInput, isGlobal, setClicked, fileUrl }) => {
  const { scene, animations } = useGLTF(fileUrl);
  const clone = useMemo(() => {
      const clonedScene = SkeletonUtils.clone(scene);
      
      clonedScene.updateMatrixWorld(true);
      const box = new THREE.Box3().setFromObject(clonedScene);
      const size = box.getSize(new THREE.Vector3());
      const maxDim = Math.max(size.x, size.y, size.z);
      
      // Significantly reduced size to perfectly fit inside the small login frame! 
      const normalizedScale = 1.8 / (maxDim || 1);
      clonedScene.scale.setScalar(normalizedScale);
      
      const center = box.getCenter(new THREE.Vector3());
      clonedScene.position.x = -center.x * normalizedScale;
      clonedScene.position.y = -(box.min.y * normalizedScale);
      clonedScene.position.z = -center.z * normalizedScale;
      
      return clonedScene;
  }, [scene]);
  
  const { nodes, materials } = useGraph(clone);
  
  // Extract and automatically play whatever baked animations the 3D artist put in the file!
  const { actions } = useAnimations(animations, clone);
  useEffect(() => {
     if (actions && Object.keys(actions).length > 0) {
         // plays the first animation infinitely
         const firstAction = Object.keys(actions)[0];
         actions[firstAction].reset().play();
     }
  }, [actions]);

  // We find the bone nodes manually since VRChat/GLTF bone names vary perfectly
  const initialRots = useRef({});

  const bones = useMemo(() => {
    let head = null, armL = null, armR = null;
    initialRots.current = {};

    Object.values(nodes).forEach(node => {
      if (node.isBone) {
        const name = node.name.toLowerCase();
        
        // Exact IK matching strictly avoiding fingers and hair
        if ((name.includes('arm') || name.includes('shoulder')) && !name.includes('finger') && !name.includes('hair') && !name.includes('fore')) {
           if ((name.includes('l') || name.includes('left')) && !armL) armL = node;
           if ((name.includes('r') || name.includes('right')) && !armR) armR = node;
        }

        if (name.includes('head') && !name.includes('hair')) head = node;
      }
    });

    // Save exact native skeletal rest poses
    if (head) initialRots.current.head = head.rotation.clone();
    if (armL) initialRots.current.armL = armL.rotation.clone();
    if (armR) initialRots.current.armR = armR.rotation.clone();

    return { head, armL, armR };
  }, [nodes]);

  const isPassword = focusedInput === 'password';
  const isId = focusedInput === 'userId';

  // Smooth transitions using literal 3D math on top of native rest poses!
  useFrame((state, delta) => {
    // 1. Head Tracking logic relative to initial pose
    if (bones.head && initialRots.current.head) {
        let tX = 0, tY = 0;
        if (isPassword) { tY = -0.15; } 
        else if (isId) { tY = -0.4; } 
        else {
           tX = (state.pointer.x * Math.PI) / 6;
           tY = -(state.pointer.y * Math.PI) / 6;
        }
        
        bones.head.rotation.set(
            THREE.MathUtils.lerp(bones.head.rotation.x, initialRots.current.head.x + tY, delta * 5),
            THREE.MathUtils.lerp(bones.head.rotation.y, initialRots.current.head.y + tX, delta * 5),
            initialRots.current.head.z
        );
    }
    
    // 2. Arms Peekaboo logic cleanly relative to initial pose!
    if (bones.armL && initialRots.current.armL && bones.armR && initialRots.current.armR) {
        if (isPassword) {
            bones.armL.rotation.z = THREE.MathUtils.lerp(bones.armL.rotation.z, initialRots.current.armL.z + 1.2, delta * 6);
            bones.armL.rotation.x = THREE.MathUtils.lerp(bones.armL.rotation.x, initialRots.current.armL.x - 1.5, delta * 6);
            
            bones.armR.rotation.z = THREE.MathUtils.lerp(bones.armR.rotation.z, initialRots.current.armR.z - 1.2, delta * 6);
            bones.armR.rotation.x = THREE.MathUtils.lerp(bones.armR.rotation.x, initialRots.current.armR.x - 1.5, delta * 6);
        } else {
            // Drop arms back to exactly how they natively were (fixes the mangled arm glitch)
            bones.armL.rotation.z = THREE.MathUtils.lerp(bones.armL.rotation.z, initialRots.current.armL.z, delta * 4);
            bones.armL.rotation.x = THREE.MathUtils.lerp(bones.armL.rotation.x, initialRots.current.armL.x, delta * 4);
            
            bones.armR.rotation.z = THREE.MathUtils.lerp(bones.armR.rotation.z, initialRots.current.armR.z, delta * 4);
            bones.armR.rotation.x = THREE.MathUtils.lerp(bones.armR.rotation.x, initialRots.current.armR.x, delta * 4);
        }
    }
    
    // 3. Complete horizontal walking and dynamic breathing
    if (nodes._rootJoint) {
        const time = state.clock.elapsedTime;
        // Make her visibly walk around side-to-side across the window universally!
        nodes._rootJoint.position.x = Math.sin(time) * 1.2;
        // Natural idle walking bob (bobs up and down twice per horizontal sway)
        nodes._rootJoint.position.y = Math.pow(Math.sin(time * 2), 2) * 0.15;
        // Gently leaning into the walk
        nodes._rootJoint.rotation.z = Math.sin(time) * -0.05;
        
        // Massive floating behavior only for global screens
        if (isGlobal) {
            nodes._rootJoint.position.y += Math.sin(time * 1.5) * 0.5;
            nodes._rootJoint.rotation.y = Math.sin(time) * 0.2;
        } else {
            // Keep her facing forward on login screen generally
            nodes._rootJoint.rotation.y = Math.sin(time * 0.5) * 0.1;
        }
    }
  });

  return (
    <group 
      position={[0, -1.2, 0]} 
      scale={isGlobal ? 0.8 : 1}
      dispose={null} 
      onClick={(e) => { e.stopPropagation(); setClicked(true); setTimeout(() => setClicked(false), 4000); }}
    >
      <group>
        <primitive object={clone} />
      </group>
    </group>
  );
};

const ShreyMascot = ({ focusedInput, isGlobal }) => {
  const [clicked, setClicked] = useState(false);
  const { activeMascot } = useMascot();
  const isPassword = focusedInput === 'password';

  // If "No Character" is selected or missing file, don't render canvas or container at all!
  if (!activeMascot || !activeMascot.file) return null;

  return (
      <div className={`relative z-40 ${isGlobal ? 'fixed bottom-8 left-8 w-64 h-64 cursor-pointer drop-shadow-2xl' : 'w-[20rem] h-[20rem] mx-auto -mt-16 -mb-6 cursor-pointer hover:scale-105 transition-transform'}`}>
         
         <AnimatePresence>
            {isPassword && !clicked && (
               <motion.div 
                 initial={{ opacity: 0, scale: 0.5, y: 10, rotate: -5 }} 
                 animate={{ opacity: 1, scale: 1, y: -5, rotate: 0 }} 
                 exit={{ opacity: 0, scale: 0.5 }}
                 className="absolute top-10 right-0 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-xs font-bold py-2.5 px-4 rounded-2xl shadow-xl border-2 border-slate-200 dark:border-slate-700 z-50 whitespace-nowrap pointer-events-none"
               >
                 ahh i'm just kidding 👀
                 <div className="absolute -bottom-2.5 left-6 w-3.5 h-3.5 bg-white dark:bg-slate-800 rotate-45 border-r-2 border-b-2 border-slate-200 dark:border-slate-700"></div>
               </motion.div>
            )}

            {clicked && (
               <motion.div 
                 initial={{ opacity: 0, scale: 0.5, y: 10, rotate: 5 }} 
                 animate={{ opacity: 1, scale: 1, y: -10, rotate: 0 }} 
                 exit={{ opacity: 0, scale: 0.5 }}
                 className="absolute top-2 -right-8 bg-gradient-to-r from-indigo-500 to-pink-500 text-white text-sm font-black py-3 px-5 rounded-2xl shadow-[0_0_30px_rgba(99,102,241,0.6)] border-2 border-white/20 z-50 whitespace-nowrap pointer-events-none"
               >
                 heya i'm your matchmaker!!! ✨
                 <div className="absolute -bottom-2 left-6 w-4 h-4 bg-pink-500 rotate-45 border-r-2 border-b-2 border-white/20 -z-10"></div>
               </motion.div>
            )}
         </AnimatePresence>

         <div className="w-full h-full pointer-events-auto">
            <Canvas camera={{ position: [0, 0, 4.5], fov: 45 }}>
               <ambientLight intensity={0.8} />
               <directionalLight position={[5, 10, 5]} intensity={1.5} castShadow />
               <Suspense fallback={null}>
                  <GenuineMascot focusedInput={focusedInput} isGlobal={isGlobal} setClicked={setClicked} fileUrl={activeMascot.file} />
                  <Environment preset="city" />
               </Suspense>
               <ContactShadows position={[0, -1.8, 0]} opacity={0.5} scale={10} blur={2.5} far={4} />
            </Canvas>
         </div>
      </div>
  );
};

export default ShreyMascot;
