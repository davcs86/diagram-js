'use strict';

/* global bootstrapDiagram, inject */

var modelingModule = require('../../../../lib/features/modeling'),
    replaceModule = require('../../../../lib/features/replace');

var domQuery = require('min-dom/lib/query');


describe('features/Replace', function() {

  beforeEach(bootstrapDiagram({
    modules: [
      modelingModule,
      replaceModule
    ]
  }));


  var rootShape, parentShape, originalShape;

  beforeEach(inject(function(elementFactory, canvas) {

    rootShape = elementFactory.createRoot({
      id: 'root'
    });

    canvas.setRootElement(rootShape);

    parentShape = elementFactory.createShape({
      id: 'parent',
      x: 100, y: 100, width: 300, height: 300
    });

    canvas.addShape(parentShape, rootShape);

    originalShape = elementFactory.createShape({
      id: 'originalShape',
      x: 110, y: 110, width: 100, height: 100
    });

    canvas.addShape(originalShape, parentShape);
  }));


  describe('#replaceElement', function() {

    it('should add new shape', inject(function(elementRegistry, replace) {

      // given
      var replacement = {
        id: 'replacement',
        width: 200,
        height: 200
      };

      // when
      var newShape = replace.replaceElement(originalShape, replacement);

      // then
      expect(newShape).to.exist;

      // expect added
      expect(elementRegistry.get('replacement')).to.equal(newShape);
    }));


    it('should define custom attributes on new shape', inject(function(replace) {

      // given
      var replacement = {
        id: 'replacement',
        width: 200,
        height: 200,
        customArray: ['FOO', 'BAR'],
        customString: 'foobar'
      };

      // when
      var newShape = replace.replaceElement(originalShape, replacement);

      // then
      expect(newShape.customArray).to.equal(replacement.customArray);
      expect(newShape.customString).to.equal(replacement.customString);
    }));


    it('should delete old shape', inject(function(elementFactory, replace, elementRegistry) {

      // given
      var replacement = {
        id: 'replacement',
        width: 200,
        height: 200
      };

      // shape replacement
      replace.replaceElement(originalShape, replacement);

      // then
      expect(originalShape.parent).to.be.null;
    }));


    it('should return new shape', inject(function(elementRegistry, replace) {

      // given
      var replacement = {
        id: 'replacement',
        width: 200,
        height: 200
      };

      // shape replacement
      var newShape = replace.replaceElement(originalShape, replacement);

      // then
      expect(newShape).to.exist;
      expect(newShape.id).to.equal('replacement');
    }));


    it('should add correct attributes to new shape', inject(function(elementFactory, replace, elementRegistry) {

      // given
      var replacement = {
        id: 'replacement',
        width: 200,
        height: 200
      };

      // shape replacement
      replace.replaceElement(originalShape, replacement);

      // then
      var replacementShape = elementRegistry.get('replacement');
      expect(replacementShape.x).to.equal(110);
      expect(replacementShape.y).to.equal(110);
      expect(replacementShape.width).to.equal(200);
      expect(replacementShape.height).to.equal(200);
    }));


    it('should retain position when setting odd height', inject(function(elementFactory, replace, elementRegistry) {
      // given
      var replacement = {
        id: 'replacement',
        width: 200,
        height: 201
      };

      // shape replacement
      replace.replaceElement(originalShape, replacement);

      // then
      var replacementShape = elementRegistry.get('replacement');
      expect(replacementShape.x).to.equal(110);
      expect(replacementShape.y).to.equal(110);
      expect(replacementShape.width).to.equal(200);
      expect(replacementShape.height).to.equal(201);
    }));


    it('should retain position when setting odd width', inject(function(elementFactory, replace, elementRegistry) {
      // given
      var replacement = {
        id: 'replacement',
        width: 201,
        height: 200
      };

      // shape replacement
      replace.replaceElement(originalShape, replacement);

      // then
      var replacementShape = elementRegistry.get('replacement');
      expect(replacementShape.x).to.equal(110);
      expect(replacementShape.y).to.equal(110);
      expect(replacementShape.width).to.equal(201);
      expect(replacementShape.height).to.equal(200);
    }));


    it('should retain position when setting odd width and height',
      inject(function(elementFactory, replace, elementRegistry) {
        // given
        var replacement = {
          id: 'replacement',
          width: 201,
          height: 201
        };

        // shape replacement
        replace.replaceElement(originalShape, replacement);

        // then
        var replacementShape = elementRegistry.get('replacement');
        expect(replacementShape.x).to.equal(110);
        expect(replacementShape.y).to.equal(110);
        expect(replacementShape.width).to.equal(201);
        expect(replacementShape.height).to.equal(201);
      })
    );

  });


  describe('reconnect', function() {

    var sourceShape,
        targetShape,
        connection;

    beforeEach(inject(function(elementFactory, canvas, modeling) {

      sourceShape = originalShape;

      targetShape = elementFactory.createShape({
        id: 'targetShape',
        x: 290, y: 110, width: 100, height: 100
      });

      canvas.addShape(targetShape, parentShape);

      connection = modeling.createConnection(sourceShape, targetShape, {
        id: 'connection',
        waypoints: [ { x: 210, y: 160 }, { x: 290, y: 160 } ]
      }, parentShape);
    }));


    it('should reconnect start', inject(function(elementFactory, replace, elementRegistry) {

      // given
      var replacement = {
        id: 'replacement',
        width: 120,
        height: 120
      };

      // when
      var replacedShape = replace.replaceElement(sourceShape, replacement);

      // then
      expect(replacedShape.outgoing[0]).to.exist;
    }));


    it('should reconnect end', inject(function(elementFactory, replace, elementRegistry) {

      // given
      var replacement = {
        id: 'replacement',
        width: 80,
        height: 80
      };

      // when
      var replacedShape = replace.replaceElement(targetShape, replacement);

      // then
      expect(replacedShape.incoming[0]).to.exist;
    }));


    it('should adopt children', inject(function(elementFactory, replace, elementRegistry, eventBus) {

      // given
      var replacement = {
        id: 'replacement',
        width: 300,
        height: 300
      };

      // when
      var newShape = replace.replaceElement(parentShape, replacement);

      // then
      expect(newShape.children).to.contain(originalShape);
      expect(newShape.children).to.contain(connection);
      expect(newShape.children).to.contain(targetShape);

      expect(originalShape.parent).to.eql(newShape);
      expect(connection.parent).to.eql(newShape);
      expect(targetShape.parent).to.eql(newShape);

      expect(originalShape.outgoing).to.contain(connection);
      expect(targetShape.incoming).to.contain(connection);
    }));


    it('should adopt children and show them in the DOM',
      inject(function(canvas, elementFactory, replace, elementRegistry) {

        // given
        var replacement = {
          id: 'replacement',
          width: 300,
          height: 300
        };

        // when
        replace.replaceElement(parentShape, replacement);

        var newShapeContainer = domQuery('[data-element-id="replacement"]', canvas.getContainer());

        // then
        expect(domQuery('[data-element-id="originalShape"]', newShapeContainer.parentNode)).to.exist;
        expect(domQuery('[data-element-id="targetShape"]', newShapeContainer.parentNode)).to.exist;
      })
    );


    it('should retain moved children in command context', inject(function(replace, eventBus) {

      // given
      var replacement = {
        id: 'replacement',
        width: 300,
        height: 300
      };

      eventBus.on('commandStack.elements.move.postExecuted', function(event) {
        // then
        var shapes = event.context.shapes;
        expect(shapes).not.to.be.empty;
        expect(shapes).to.have.length(3);
      });

      // when
      replace.replaceElement(parentShape, replacement);
    }));

  });


  describe('expand', function() {

    var collapsedShape,
        hiddenContainedChild,
        hiddenOverlappingChild,
        hiddenOutOfBoundsChild,
        stillHiddenChild;

    beforeEach(inject(function(canvas, elementFactory) {

      collapsedShape = elementFactory.createShape({
        id: 'collapsedShape',
        x: 500, y: 100, width: 300, height: 300,
        collapsed: true
      });

      canvas.addShape(collapsedShape, rootShape);

      hiddenContainedChild = elementFactory.createShape({
        id: 'hiddenContainedChild',
        x: 650, y: 110, width: 100, height: 100,
        hidden: true
      });

      canvas.addShape(hiddenContainedChild, collapsedShape);

      hiddenOverlappingChild = elementFactory.createShape({
        id: 'hiddenOverlappingChild',
        x: 450, y: 50, width: 100, height: 100,
        hidden: true
      });

      canvas.addShape(hiddenOverlappingChild, collapsedShape);

      hiddenOutOfBoundsChild = elementFactory.createShape({
        id: 'hiddenOutOfBoundsChild',
        x: 825, y: 425, width: 100, height: 100,
        hidden: true
      });

      canvas.addShape(hiddenOutOfBoundsChild, collapsedShape);

      stillHiddenChild = elementFactory.createShape({
        id: 'stillHiddenChild',
        x: 375, y: 250, width: 100, height: 100,
        hidden: true
      });

      canvas.addShape(stillHiddenChild, collapsedShape);
    }));


    it('should show children', inject(function(replace, eventBus) {

      // given
      var replacement = {
        id: 'expanded',
        width: 300,
        height: 300,
        collapsed: false
      };

      var originalChildren = collapsedShape.children.slice();

      // when
      var expandedShape = replace.replaceElement(collapsedShape, replacement);

      // then
      expect(expandedShape.children).to.eql(originalChildren);
      expect(expandedShape.children).to.satisfy(allShown());
    }));


    describe('auto resize', function() {

      it('should accomodate visible children',
        inject(function(replace, eventBus, elementRegistry) {

          // given
          var replacement = {
            id: 'expanded',
            width: 300,
            height: 300,
            collapsed: false
          };

          // when
          var expandedShape = replace.replaceElement(collapsedShape, replacement);

          // then
          var overlappingChild = elementRegistry.get('hiddenOverlappingChild');
          expect(expandedShape.x).to.be.lessThan(overlappingChild.x);
          expect(expandedShape.y).to.be.lessThan(overlappingChild.y);

          var outOfBoundsChild = elementRegistry.get('hiddenOutOfBoundsChild');
          expect(expandedShape.x + expandedShape.width).to.be.greaterThan(outOfBoundsChild.x + outOfBoundsChild.width);
          expect(expandedShape.y + expandedShape.height).to.be.greaterThan(outOfBoundsChild.y + outOfBoundsChild.height);
        })
      );


      it('should ignore hidden children',
        inject(function(replace, eventBus, canvas) {

          // given
          var replacement = {
            id: 'expanded',
            width: 300,
            height: 300,
            collapsed: false
          };

          var originalChildren = collapsedShape.children.slice();

          eventBus.once('commandStack.shape.replace.executed', function(event) {
            // keep hidden
            stillHiddenChild.hidden = true;
          });

          // when
          var expandedShape = replace.replaceElement(collapsedShape, replacement);

          // then
          expect(expandedShape.children).to.eql(originalChildren);
          expect(expandedShape.x).to.be.greaterThan(stillHiddenChild.x);
        })
      );

    });


    describe('undo', function() {

      it('should hide children', inject(function(replace, eventBus, commandStack, elementRegistry) {

        // given
        var replacement = {
          id: 'expanded',
          width: 300,
          height: 300,
          collapsed: false
        };

        var originalChildren = collapsedShape.children.slice();

        replace.replaceElement(collapsedShape, replacement);

        // when
        commandStack.undo();

        // then
        expect(collapsedShape.children).to.eql(originalChildren);

        expect(collapsedShape.children).to.satisfy(allHidden());
      }));


      it('should restore old size',
        inject(function(replace, commandStack) {

          // given
          var replacement = {
            id: 'expanded',
            width: 300,
            height: 300,
            collapsed: false
          };

          replace.replaceElement(collapsedShape, replacement);

          var oldSize = {
            x: collapsedShape.x,
            y: collapsedShape.y,
            width: collapsedShape.width,
            height: collapsedShape.height
          };

          // when
          commandStack.undo();

          // then
          expect(collapsedShape).to.have.bounds(oldSize);
        })
      );

    });

  });


  describe('collapse', function() {

    var expandedShape,
        shownChildShape,
        hiddenChildShape;

    beforeEach(inject(function(elementFactory, canvas) {

      expandedShape = elementFactory.createShape({
        id: 'expandedShape',
        x: 100, y: 500, width: 300, height: 300,
        collapsed: false
      });

      canvas.addShape(expandedShape, rootShape);

      shownChildShape = elementFactory.createShape({
        id: 'shownChildShape',
        x: 110, y: 510,
        width: 100, height: 100
      });

      canvas.addShape(shownChildShape, expandedShape);

      hiddenChildShape = elementFactory.createShape({
        id: 'hiddenChildShape',
        x: 110, y: 510,
        width: 100, height: 100,
        hidden: true
      });

      canvas.addShape(hiddenChildShape, expandedShape);
    }));


    it('should hide children', inject(function(replace, eventBus) {

      var replacement = {
        id: 'collapsed',
        width: 300,
        height: 300,
        collapsed: true
      };

      var originalChildren = expandedShape.children.slice();

      // when
      var collapsedShape = replace.replaceElement(expandedShape, replacement);

      // then
      expect(collapsedShape.children).to.eql(originalChildren);
      expect(collapsedShape.children).to.satisfy(allHidden());
    }));


    describe('undo', function() {

      it('should show children',
        inject(function(replace, eventBus, commandStack, elementRegistry) {

          // given
          var replacement = {
            id: 'collapsed',
            width: 300,
            height: 300,
            collapsed: true
          };

          var originalChildren = expandedShape.children.slice();

          replace.replaceElement(expandedShape, replacement);

          // when
          commandStack.undo();

          // then
          expect(expandedShape.children).to.eql(originalChildren);
          expect(shownChildShape.hidden).to.not.eql(true);
          expect(hiddenChildShape.hidden).to.eql(true);

        })
      );

    });

  });


  describe('nothing changes', function() {

    var collapsedShape,
        hiddenContainedChild,
        expandedShape,
        shownChildShape,
        hiddenChildShape;



    beforeEach(inject(function(canvas, elementFactory) {

      collapsedShape = elementFactory.createShape({
        id: 'collapsedShape',
        x: 500, y: 100, width: 300, height: 300,
        collapsed: true
      });

      canvas.addShape(collapsedShape, rootShape);

      hiddenContainedChild = elementFactory.createShape({
        id: 'hiddenContainedChild',
        x: 650, y: 110, width: 100, height: 100,
        hidden: true
      });

      canvas.addShape(hiddenContainedChild, collapsedShape);

      expandedShape = elementFactory.createShape({
        id: 'expandedShape',
        x: 100, y: 500, width: 300, height: 300,
        collapsed: false
      });

      canvas.addShape(expandedShape, rootShape);

      shownChildShape = elementFactory.createShape({
        id: 'shownChildShape',
        x: 110, y: 510,
        width: 100, height: 100
      });

      canvas.addShape(shownChildShape, expandedShape);

      hiddenChildShape = elementFactory.createShape({
        id: 'hiddenChildShape',
        x: 110, y: 510,
        width: 100, height: 100,
        hidden: true
      });

      canvas.addShape(hiddenChildShape, expandedShape);

    }));


    it('replace collapsed with collapsed', inject(function(replace) {

      // given
      var replacement = {
        id: 'replacement',
        width: 200,
        height: 200,
        collapsed: true
      };
      var originalChildren = collapsedShape.children.slice();

      // when
      var stillCollapsed = replace.replaceElement(collapsedShape, replacement);

      // then nothing should change
      expect(stillCollapsed.children).to.eql(originalChildren);
      expect(stillCollapsed.children).to.satisfy(allHidden());

    }));

    it('replace expanded with expanded', inject(function(replace, elementRegistry) {

      // given
      var replacement = {
        id: 'replacement',
        width: 200,
        height: 200,
        collapsed: false
      };
      var originalChildren = expandedShape.children.slice();

      // when
      var stillExpanded = replace.replaceElement(expandedShape, replacement);

      // then nothing should change
      var shownChildShape = elementRegistry.get('shownChildShape');
      var hiddenChildShape = elementRegistry.get('hiddenChildShape');

      expect(stillExpanded.children).to.eql(originalChildren);
      expect(shownChildShape.hidden).not.to.eql(true);
      expect(hiddenChildShape.hidden).to.eql(true);

    }));

  });

  describe('undo/redo support', function() {

    it('should undo replace', inject(function(elementFactory, replace, elementRegistry, commandStack) {

      // given
      var replacement = {
        id: 'replacement',
        width: 200,
        height: 200
      };
      replace.replaceElement(originalShape, replacement);

      // when
      commandStack.undo();

      // then
      var shape = elementRegistry.get('originalShape');
      expect(shape.width).to.equal(100);
    }));


    it('should redo', inject(function(elementFactory, replace, elementRegistry, commandStack) {

      // given
      var replacement = {
        id: 'replacement',
        width: 200,
        height: 200
      };
      replace.replaceElement(originalShape, replacement);

      var replacementShape = elementRegistry.get('replacement');
      var replacement2 = {
        id: 'replacement2',
        width: 280,
        height: 280
      };
      replace.replaceElement(replacementShape, replacement2);

      // when
      commandStack.undo();
      commandStack.undo();

      commandStack.redo();
      commandStack.redo();

      // then
      var redoShape = elementRegistry.get('replacement2');
      expect(redoShape.width).to.equal(280);
    }));

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
