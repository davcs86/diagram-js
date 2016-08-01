'use strict';

require('../../../TestHelper');

/* global bootstrapDiagram, inject */


var modelingModule = require('../../../../lib/features/modeling');

describe.only('features/modeling - toggle collapsed', function() {

  beforeEach(bootstrapDiagram({ modules: [ modelingModule ] }));

  var rootShape;

  beforeEach(inject(function(elementFactory, canvas) {

    rootShape = elementFactory.createRoot({
      id: 'root'
    });

    canvas.setRootElement(rootShape);

  }));

  describe('expand', function() {

    var shapeToExpand,
        hiddenContainedChild,
        hiddenOverlappingChild,
        hiddenOutOfBoundsChild,
        stillHiddenChild;

    beforeEach(inject(function(elementFactory, canvas) {

      shapeToExpand = elementFactory.createShape({
        id: 'shapeToExpand',
        x: 100, y: 100, width: 300, height: 300,
        collapsed: true
      });

      canvas.addShape(shapeToExpand, rootShape);

      hiddenContainedChild = elementFactory.createShape({
        id: 'hiddenContainedChild',
        x: 150, y: 110, width: 100, height: 100,
        hidden: true
      });

      canvas.addShape(hiddenContainedChild, shapeToExpand);

      hiddenOverlappingChild = elementFactory.createShape({
        id: 'hiddenOverlappingChild',
        x: 50, y: 50, width: 100, height: 100,
        hidden: true
      });

      canvas.addShape(hiddenOverlappingChild, shapeToExpand);

      hiddenOutOfBoundsChild = elementFactory.createShape({
        id: 'hiddenOutOfBoundsChild',
        x: 325, y: 425, width: 100, height: 100,
        hidden: true
      });

      canvas.addShape(hiddenOutOfBoundsChild, shapeToExpand);

      stillHiddenChild = elementFactory.createShape({
        id: 'stillHiddenChild',
        x: 15, y: 250, width: 100, height: 100,
        hidden: true
      });

      canvas.addShape(stillHiddenChild, shapeToExpand);

    }));


    it('expand and should show children', inject(function(modeling) {

      // given
      var originalChildren = shapeToExpand.children.slice();

      // when
      modeling.toggleCollapse(shapeToExpand);

      // then
      expect(shapeToExpand.children).to.eql(originalChildren);
      expect(shapeToExpand.children).to.satisfy(allShown());

    }));

    describe('auto resize', function() {

      it('should accomodate visible children',
        inject(function(modeling, elementRegistry) {

          // given

          // when
          modeling.toggleCollapse(shapeToExpand);

          // then
          var overlappingChild = elementRegistry.get('hiddenOverlappingChild');
          expect(shapeToExpand.x).to.be.lessThan(overlappingChild.x);
          expect(shapeToExpand.y).to.be.lessThan(overlappingChild.y);

          var outOfBoundsChild = elementRegistry.get('hiddenOutOfBoundsChild');
          expect(shapeToExpand.x + shapeToExpand.width)
                .to.be.greaterThan(outOfBoundsChild.x + outOfBoundsChild.width);
          expect(shapeToExpand.y + shapeToExpand.height)
                .to.be.greaterThan(outOfBoundsChild.y + outOfBoundsChild.height);
        }));


      it('should ignore hidden children',
        inject(function(modeling, eventBus) {

          // given
          eventBus.once('commandStack.shape.toggleCollapse.executed', function(event) {
            // keep hidden
            stillHiddenChild.hidden = true;
          });

          // when
          modeling.toggleCollapse(shapeToExpand);

          // then
          expect(shapeToExpand.x).to.be.greaterThan(stillHiddenChild.x);

        }));

    });

    describe('undo', function() {

      it('collapse and hide all children', inject(function(modeling, commandStack) {

        // given
        var originalChildren = shapeToExpand.children.slice();
        modeling.toggleCollapse(shapeToExpand);

        // when
        commandStack.undo();

        // then
        expect(shapeToExpand.collapsed).to.eql(true);
        expect(shapeToExpand.children).to.eql(originalChildren);
        expect(shapeToExpand.children).to.satisfy(allHidden());

      }));

      it('restore old size', inject(function(modeling, commandStack) {

        // given

        var oldSize = {
          x: shapeToExpand.x,
          y: shapeToExpand.y,
          width: shapeToExpand.width,
          height: shapeToExpand.height
        };
        modeling.toggleCollapse(shapeToExpand);

        // when
        commandStack.undo();

        // then
        expect(shapeToExpand).to.have.bounds(oldSize);

      }));

    });


  });


  describe('collapse', function() {

    var shapeToCollapse,
        shownChildShape,
        hiddenChildShape;

    beforeEach(inject(function(elementFactory, canvas) {

      shapeToCollapse = elementFactory.createShape({
        id: 'shapeToCollapse',
        x: 100, y: 100, width: 300, height: 300,
        collapsed: false
      });

      canvas.addShape(shapeToCollapse, rootShape);

      shownChildShape = elementFactory.createShape({
        id: 'shownChildShape',
        x: 110, y: 110,
        width: 100, height: 100
      });

      canvas.addShape(shownChildShape, shapeToCollapse);

      hiddenChildShape = elementFactory.createShape({
        id: 'hiddenChildShape',
        x: 220, y: 110,
        width: 100, height: 100,
        hidden: true
      });

      canvas.addShape(hiddenChildShape, shapeToCollapse);

    }));


    it('collapse and hide children', inject(function(modeling) {

      // given
      var originalChildren = shapeToCollapse.children.slice();

      // when
      modeling.toggleCollapse(shapeToCollapse);

      // then
      expect(shapeToCollapse.collapsed).to.eql(true);
      expect(shapeToCollapse.children).to.eql(originalChildren);
      expect(shapeToCollapse.children).to.satisfy(allHidden());

    }));

    describe('undo', function() {

      it('expand and show children',
        inject(function(modeling, commandStack) {

          // given
          var originalChildren = shapeToCollapse.children.slice();
          modeling.toggleCollapse(shapeToCollapse);

          // when
          commandStack.undo();

          // then
          expect(shapeToCollapse.collapsed).to.eql(false);
          expect(shapeToCollapse.children).to.eql(originalChildren);
          expect(shownChildShape.hidden).to.not.eql(true);
          expect(hiddenChildShape.hidden).to.eql(true);

        }));

      it('restore old size',
        inject(function(modeling, commandStack) {

          // given
          var oldSize = {
            x: shapeToCollapse.x,
            y: shapeToCollapse.y,
            width: shapeToCollapse.width,
            height: shapeToCollapse.height
          };

          modeling.toggleCollapse(shapeToCollapse);

          // when
          commandStack.undo();

          // then
          expect(shapeToCollapse).to.have.bounds(oldSize);

        }));

    });

  });

});


/////////// helpers /////////////////////////////


function allHidden() {
  return childrenHidden(true);
}

function allShown() {
  return childrenHidden(false);
}

function childrenHidden(hidden) {
  return function(children) {
    return children.every(function(c) {
      return c.hidden == hidden;
    });
  };
}
