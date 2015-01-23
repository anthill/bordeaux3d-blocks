'use strict';

/*
    * Move mouse: look around
    * Mouse down: move forward
    * Mouse up: stop moving forward
*/

var THREE = require('three');
var _getFloorHeight = require('../utils/ray/distanceToFloor.js');

var cos = Math.cos,
    sin = Math.sin,
    pow = Math.pow;

var HEIGHT = 1.8;

var WALKING_SPEED = 0.05;

var DISTANCE_TO_LOOK_AT = 20;
var MAX_HORI_SPEED = Math.PI/100;
var MAX_VERTI_SPEED = Math.PI/120;

module.exports = function(camera, scene, domElement, loadObjects){

    var getFloorHeight = _getFloorHeight(scene);

    var alpha;
    var beta;
    var animationFrame;
    var rotation = 0;

    var lookAtPoint;

    // 1°) Camera initial settings
    camera.up = new THREE.Vector3(0, 0, 1);
    camera.near = 1;
    camera.far = 50;

    var rayCasterPosition = camera.position;
    rayCasterPosition.z = 10000;
    var distanceToFloor = getFloorHeight(rayCasterPosition);
    // console.log('distance to floor', distanceToFloor, camera.position.z + HEIGHT - distanceToFloor)

    camera.position.z = distanceToFloor !== undefined ? camera.position.z + HEIGHT - distanceToFloor : HEIGHT;

    // Looking north
    lookAtPoint = new THREE.Vector3( camera.position.x, camera.position.y + DISTANCE_TO_LOOK_AT, camera.position.z )
    camera.lookAt( lookAtPoint );


    // 2°) Functions to allow camera movement according to user input
    function moveCamera(){
        var newx = camera.position.x +
            ((lookAtPoint.x - camera.position.x)*cos(alpha) - (lookAtPoint.y - camera.position.y)*sin(alpha));
        var newy = camera.position.y +
            ((lookAtPoint.x - camera.position.x)*sin(alpha) + (lookAtPoint.y - camera.position.y)*cos(alpha));
        var newz = camera.position.z + 20*DISTANCE_TO_LOOK_AT * Math.sin(beta);
        // console.log("beta", beta, "alpha", alpha, "newz", newz)

        lookAtPoint.x = newx;
        lookAtPoint.y = newy;
        lookAtPoint.z = newz;

        camera.lookAt( lookAtPoint );
        rotation += alpha;
    }

    function mouseMoveListener(e){
        var canvasBoundingRect = domElement.getBoundingClientRect();

        var deltaX = e.clientX - canvasBoundingRect.width/2;
        var deltaZ = e.clientY - canvasBoundingRect.height/2;

        if(Math.abs(deltaX) > canvasBoundingRect.width/10 || Math.abs(deltaZ) > canvasBoundingRect.height/20){

            if (Math.abs(deltaX) > canvasBoundingRect.width/10){
                alpha = MAX_HORI_SPEED *
                    (Math.abs(deltaX) - canvasBoundingRect.width/10)/
                    (canvasBoundingRect.width/2 - canvasBoundingRect.width/10);
                if(deltaX > 0)
                    alpha = -alpha;
            } else {alpha = 0}

            if (Math.abs(deltaZ) > canvasBoundingRect.height/20){
                beta = MAX_VERTI_SPEED *
                    (Math.abs(deltaZ) - canvasBoundingRect.height/20)/
                    (canvasBoundingRect.height/2 - canvasBoundingRect.height/20);
                if(deltaZ > 0)
                    beta = -beta;
            } else { beta = 0}

            moveCamera();

        }

    }

    var moveAnimationFrame;
    
    function mouseDownListener(){

        moveAnimationFrame = requestAnimationFrame(function moveForward(){

            var moveVector = {
                x : lookAtPoint.x - camera.position.x,
                y : lookAtPoint.y - camera.position.y,
            };
            camera.position.x += WALKING_SPEED*moveVector.x;
            lookAtPoint.x     += WALKING_SPEED*moveVector.x;
            camera.position.y += WALKING_SPEED*moveVector.y;
            lookAtPoint.y     += WALKING_SPEED*moveVector.y;

            var rayCasterPosition = camera.position;
            rayCasterPosition.z = 10000;
            var distanceToFloor = getFloorHeight(rayCasterPosition);
            if(distanceToFloor !== undefined){
                camera.position.z += HEIGHT - distanceToFloor;
            }

            moveAnimationFrame = requestAnimationFrame(moveForward);
        });
    }

    function mouseUpListener(){
        cancelAnimationFrame(moveAnimationFrame);
        moveAnimationFrame = undefined;
    }

    // 3°) IMPORTANT: function to load buildings when camera view has changed
    function onCameraViewChangeFirstPerson(){
        // console.log('onCameraViewChangeFirstPerson');
        
        var south = camera.position.y - 300;
        var north = camera.position.y + 300;
        var west = camera.position.x - 300;
        var east = camera.position.x + 300;

        loadObjects(scene, south, north, east, west);
    }

    // 4°) event listeners to allow camera view changes
    domElement.addEventListener('mousemove', mouseMoveListener);
    domElement.addEventListener('mousedown', mouseDownListener);
    domElement.addEventListener('mouseup', mouseUpListener);
    camera.on('cameraviewchange', onCameraViewChangeFirstPerson);

    // 5°) IMPORTANT: don't forget to deactivate event listeners
    return function desactivate(){
        domElement.removeEventListener('mousemove', mouseMoveListener);
        domElement.removeEventListener('mousedown', mouseDownListener);
        domElement.removeEventListener('mouseup', mouseUpListener);
        camera.off('cameraviewchange', onCameraViewChangeFirstPerson);
        cancelAnimationFrame(moveAnimationFrame);
        moveAnimationFrame = undefined;
    };

};