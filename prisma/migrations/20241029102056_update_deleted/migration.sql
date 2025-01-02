-- DropForeignKey
ALTER TABLE `productoncart` DROP FOREIGN KEY `productOnCart_cartId_fkey`;

-- DropForeignKey
ALTER TABLE `productoncart` DROP FOREIGN KEY `productOnCart_productId_fkey`;

-- AddForeignKey
ALTER TABLE `productOnCart` ADD CONSTRAINT `productOnCart_cartId_fkey` FOREIGN KEY (`cartId`) REFERENCES `cart`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `productOnCart` ADD CONSTRAINT `productOnCart_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `product`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
