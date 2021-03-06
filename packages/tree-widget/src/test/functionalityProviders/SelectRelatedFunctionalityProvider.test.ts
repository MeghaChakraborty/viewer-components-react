/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/

import { TreeModelNode, TreeNodeItem } from "@bentley/ui-components";
import { TestUtils } from "../Utils";
import { Presentation } from "@bentley/presentation-frontend";
import * as moq from "typemoq";
import { SelectRelatedFunctionalityProvider } from "../../components/trees/FunctionalityProviders";
import sinon from "sinon";
import { IModelApp, IModelConnection, NoRenderApp } from "@bentley/imodeljs-frontend";
import { IPresentationTreeDataProvider } from "@bentley/presentation-components";
import { ECInstancesNodeKey, GroupingNodeKey } from "@bentley/presentation-common";
import { assert } from "chai";
import { FunctionalityProviderTestUtils, MockClassNames, MockStrings } from "./FunctionalityProviderTestUtils";
import spatialRules from "../assets/SpatialBreakdown.json";
import { RelatedElementIdsProvider } from "../../components/trees/RelatedElementIdsProvider";


describe("SelectRelatedFunctionalityProvider", () => {
  let replaceSelectionSpy: sinon.SinonSpy;
  let relatedElementSpy: sinon.SinonSpy;

  const connection = moq.Mock.ofType<IModelConnection>();
  const dataProviderMock = moq.Mock.ofType<IPresentationTreeDataProvider>();

  before(async () => {
    if (IModelApp.initialized)
      IModelApp.shutdown();
    NoRenderApp.startup();
    Presentation.terminate();
    Presentation.initialize();
    await TestUtils.initializeUiFramework(connection.object);
    IModelApp.i18n.registerNamespace("TreeWidget");

    const ifcWallNodeKey = FunctionalityProviderTestUtils.createClassNodeKey([], [FunctionalityProviderTestUtils.createECInstanceKey(MockClassNames.IfcWall, "0x3")]);
    dataProviderMock.setup((x) => x.getNodeKey(moq.It.isObjectWith<TreeNodeItem>({ id: MockStrings.IfcWallNode }))).returns((_item: TreeNodeItem): ECInstancesNodeKey => ifcWallNodeKey);

    replaceSelectionSpy = sinon.spy(Presentation.selection, "replaceSelection" as any);
    relatedElementSpy = sinon.stub(RelatedElementIdsProvider.prototype, "getElementIds" as any);
  });

  afterEach(() => {
    replaceSelectionSpy.restore();
  });
  after(() => {
    relatedElementSpy.restore();
    TestUtils.terminateUiFramework();
    IModelApp.shutdown();
  });

  it("should perform action for SelectRelatedFunctionalityProvider", async () => {
    const dummyTreeModelItem: TreeModelNode = FunctionalityProviderTestUtils.createTreeModelNode(MockStrings.IfcWallNode);
    const functionalityProvider = new SelectRelatedFunctionalityProvider("tests", dataProviderMock.object, spatialRules.id);
    await functionalityProvider.performAction(dummyTreeModelItem);
    assert.strictEqual(relatedElementSpy.callCount, 1);
    assert.strictEqual(replaceSelectionSpy.callCount, 1);
  });

  it("should perform action for SelectRelatedFunctionalityProvider for a Group node", async () => {
    const dummyTreeModelItem: TreeModelNode = FunctionalityProviderTestUtils.createTreeModelNode(MockStrings.GroupNode);
    const functionalityProvider = new SelectRelatedFunctionalityProvider("tests", dataProviderMock.object, spatialRules.id);
    const groupNodeKey = FunctionalityProviderTestUtils.createGroupNodeKey([], 0);
    dataProviderMock.setup((x) => x.getNodeKey(moq.It.isObjectWith<TreeNodeItem>({ id: MockStrings.GroupNode }))).returns((_item: TreeNodeItem): GroupingNodeKey => groupNodeKey);
    dataProviderMock.setup((x) => x.getNodes(moq.It.isObjectWith<TreeNodeItem>({ id: MockStrings.GroupNode }))).returns(() => Promise.resolve([]));
    await functionalityProvider.performAction(dummyTreeModelItem);

    assert.strictEqual(replaceSelectionSpy.callCount, 1);
  });
});
