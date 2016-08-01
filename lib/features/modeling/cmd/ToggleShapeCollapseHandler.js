'use strict';
var cloneDeep = require('lodash/lang/cloneDeep'),
    computeChildrenBBox = require('../../resize/ResizeUtil').computeChildrenBBox;


function ToggleShapeCollapseHandler(modeling) {
  this._modeling = modeling;
}

ToggleShapeCollapseHandler.$inject = [ 'modeling'];

module.exports = ToggleShapeCollapseHandler;

function hideChildren(children) {
  children.forEach(function(c) {
    c.hidden = true;
  });
}

function showChildren(children) {
  children.forEach(function(c) {
    c.hidden = false;
  });
}

function revertChildren(children, oldChildren) {
  children.forEach(function(c) {
    oldChildren.forEach(function(oC) {
      if (c.id === oC.id) {
        c.hidden = oC.hidden;
      }
    });
  });
}

function resizeExpanded(expanded, self) {
  var visibleChildren = [];
  var children = expanded.children;

  children.forEach(function(child) {
    if (!child.hidden) {
      visibleChildren.push(child);
    }
  });

  if (visibleChildren.length > 0) {
    var newBounds = computeChildrenBBox(visibleChildren);
    self._modeling.resizeShape(expanded, newBounds);
  }
}

ToggleShapeCollapseHandler.prototype.execute = function(context) {
  var shape = context.shape;

  // toggle state
  shape.collapsed = !shape.collapsed;

  // keep visability of children
  context.hints.oldChildren = cloneDeep(shape.children);

  // hide/show children
  var children = shape.children;
  if (shape.collapsed) {
    hideChildren(children);
  } else {
    showChildren(children);
  }

  return [shape].concat(children);
};

ToggleShapeCollapseHandler.prototype.revert = function(context) {
  var shape = context.shape;

  // retoggle state
  shape.collapsed = !shape.collapsed;

  var children = shape.children;
  // set old visability of children
  revertChildren(children, context.hints.oldChildren);

  return [shape].concat(children);
};

ToggleShapeCollapseHandler.prototype.postExecute = function(context) {
  var shape = context.shape;

  if (!shape.collapsed) {
    // resize to bounds of visible children
    resizeExpanded(shape, this);
  }



};
